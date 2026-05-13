function buildSchedulePrompt() {
    const days = getWorkingDays();
    const peopleData = state.people.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        unavailabilityStart: p.unavailabilityStart || null,
        unavailabilityEnd: p.unavailabilityEnd || null,
        maxShifts: p.maxShifts,
        preferredShifts: p.preferredShifts
    }));

    const shiftsData = state.shifts.map(s => ({
        id: s.id,
        name: s.name,
        time: s.time,
        capacity: s.capacity
    }));

    const lastWeekPersonShifts = {};
    Object.entries(state.lastSchedule).forEach(([key, personIds]) => {
        personIds.forEach(personId => {
            lastWeekPersonShifts[personId] = (lastWeekPersonShifts[personId] || 0) + 1;
        });
    });

    return {
        days,
        people: peopleData,
        shifts: shiftsData,
        closedDates: state.closedDates,
        lastWeekAssignments: state.lastSchedule,
        lastWeekPersonShifts,
        shiftCounts: state.shiftCounts,
        rules: {
            noWeekends: true,
            respectCapacity: true,
            respectMaxShifts: true,
            respectUnavailability: true,
            preferPreferredShifts: true,
            balanceDistribution: true,
            noDuplicatesPerDay: true
        }
    };
}

async function callOpenRouterAPI() {
    const promptData = buildSchedulePrompt();
    const model = state.config.openrouterModel || 'google/gemini-2.0-flash-exp';

    const openrouterKey = state.config.openrouterKey || (aiOpenrouterKeyInput ? aiOpenrouterKeyInput.value : '');
    if (!openrouterKey) {
        throw new Error('Chave da API OpenRouter não configurada. Vá em Config. IA e adicione sua chave.');
    }

    const systemPrompt = `Você é um gerador de escala de trabalho. Distribua as pessoas nos turnos respeitando todas as regras abaixo.

Regras:
1. São dias úteis (seg-sex), ignorar finais de semana e feriados
2. Respeitar a capacidade máxima de cada turno
3. Respeitar o máximo de turnos por pessoa (maxShifts)
4. Não escalar pessoa que está em período de indisponibilidade (status !== disponivel OU data dentro do período unavailabilityStart-unavailabilityEnd)
5. Preferir turnos preferenciais de cada pessoa (preferredShifts)
6. Distribuir a carga de forma equilibrada entre as pessoas
7. Uma pessoa NÃO pode estar em dois turnos diferentes no mesmo dia
8. A pessoa pode ficar vaga se não houver candidatos disponíveis
9. A escala desta semana DEVE ser DIFERENTE da semana anterior (lastWeekAssignments). Não repita a mesma pessoa no mesmo turno no mesmo dia da semana
10. Use shiftCounts (total de turnos acumulados por pessoa historicamente) para priorizar quem tem menos turnos, garantindo distribuição justa ao longo do tempo

Responda APENAS com JSON válido no formato:
{"assignments":[{"shiftId":"id_do_turno","day":"YYYY-MM-DD","peopleIds":["id_da_pessoa1","id_da_pessoa2"]}]}

NÃO inclua texto, explicação ou markdown além do JSON.`;

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EscalaAI'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    const jsonStr = extractJSON(content);
    if (!jsonStr) {
        throw new Error('Resposta da IA não conteve JSON válido: ' + content.substring(0, 200));
    }

    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch {
        throw new Error('Resposta da IA não foi um JSON válido: ' + jsonStr.substring(0, 200));
    }

    const days = getWorkingDays();
    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    if (result.assignments && Array.isArray(result.assignments)) {
        result.assignments.forEach(assignment => {
            const key = `${assignment.shiftId}-${assignment.day}`;
            if (!state.schedule[key]) state.schedule[key] = [];
            if (Array.isArray(assignment.peopleIds)) {
                assignment.peopleIds.forEach(personId => {
                    if (state.people.some(p => p.id === personId) && !state.schedule[key].includes(personId)) {
                        state.schedule[key].push(personId);
                    }
                });
            }
        });
    }
}

async function callGeminiAPI() {
    const promptData = buildSchedulePrompt();

    const prompt = `Você é um gerador de escala de trabalho. Distribua as pessoas nos turnos respeitando todas as regras abaixo.

Regras:
1. São dias úteis (seg-sex), ignorar finais de semana e feriados
2. Respeitar a capacidade máxima de cada turno
3. Respeitar o máximo de turnos por pessoa (maxShifts)
4. Não escalar pessoa que está em período de indisponibilidade
5. Preferir turnos preferenciais de cada pessoa (preferredShifts)
6. Distribuir a carga de forma equilibrada entre as pessoas
7. Uma pessoa NÃO pode estar em dois turnos diferentes no mesmo dia
8. A pessoa pode ficar vaga se não houver candidatos disponíveis
9. A escala desta semana DEVE ser DIFERENTE da semana anterior (lastWeekAssignments). Não repita a mesma pessoa no mesmo turno no mesmo dia da semana
10. Use shiftCounts (total de turnos acumulados por pessoa historicamente) para priorizar quem tem menos turnos, garantindo distribuição justa ao longo do tempo

Dados:
${JSON.stringify(promptData, null, 2)}

Responda APENAS com JSON válido no formato:
{"assignments":[{"shiftId":"id_do_turno","day":"YYYY-MM-DD","peopleIds":["id_da_pessoa1","id_da_pessoa2"]}]}

NÃO inclua texto, explicação ou markdown além do JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${state.config.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonStr = extractJSON(text);
    if (!jsonStr) {
        throw new Error('Resposta da IA não conteve JSON válido: ' + text.substring(0, 200));
    }

    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch {
        throw new Error('Resposta da IA não foi um JSON válido: ' + jsonStr.substring(0, 200));
    }

    const days = getWorkingDays();
    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    if (result.assignments && Array.isArray(result.assignments)) {
        result.assignments.forEach(assignment => {
            const key = `${assignment.shiftId}-${assignment.day}`;
            if (!state.schedule[key]) state.schedule[key] = [];
            if (Array.isArray(assignment.peopleIds)) {
                assignment.peopleIds.forEach(personId => {
                    if (state.people.some(p => p.id === personId) && !state.schedule[key].includes(personId)) {
                        state.schedule[key].push(personId);
                    }
                });
            }
        });
    }
}

function runLocalGenerationAlgorithm() {
    const days = getWorkingDays();
    const assignedToday = {};

    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    state.shifts.forEach(shift => {
        days.forEach(day => {
            if (!assignedToday[day]) assignedToday[day] = [];

            let available = state.people.filter(person => {
                if (isPersonUnavailable(person, day)) return false;
                if (assignedToday[day].includes(person.id)) return false;
                if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) return false;
                return true;
            });

            available.sort((a, b) => {
                const countA = state.shiftCounts[a.id] || 0;
                const countB = state.shiftCounts[b.id] || 0;
                return countA - countB;
            });

            let needed = shift.capacity;
            for (let person of available) {
                if (needed <= 0) break;
                const totalShifts = Object.values(state.schedule).filter(arr => arr.includes(person.id)).length;
                if (totalShifts < person.maxShifts) {
                    state.schedule[`${shift.id}-${day}`].push(person.id);
                    assignedToday[day].push(person.id);
                    needed--;
                }
            }
        });
    });
}

function cleanScheduleConflicts() {
    const days = getWorkingDays();
    let removed = 0;

    // Pass 1: remove unavailable people
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            state.schedule[key] = assigned.filter(personId => {
                const person = state.people.find(p => p.id === personId);
                if (!person || isPersonUnavailable(person, day)) {
                    removed++;
                    return false;
                }
                return true;
            });
        });
    });

    // Pass 2: remove double-booked (keep only first occurrence per day)
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            const seen = new Set();
            state.schedule[key] = assigned.filter(personId => {
                if (seen.has(personId)) {
                    removed++;
                    return false;
                }
                seen.add(personId);
                return true;
            });
        });
    });

    // Pass 3: remove people exceeding maxShifts
    const personTotalCount = {};
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            (state.schedule[key] || []).forEach(personId => {
                personTotalCount[personId] = (personTotalCount[personId] || 0) + 1;
            });
        });
    });
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            state.schedule[key] = assigned.filter(personId => {
                const person = state.people.find(p => p.id === personId);
                if (person && personTotalCount[personId] > person.maxShifts) {
                    personTotalCount[personId]--;
                    removed++;
                    return false;
                }
                return true;
            });
        });
    });

    return removed;
}

function generateNextWeek() {
    if (!confirm('Avançar para a próxima semana e gerar uma nova escala? A escala atual será substituída.')) return;

    const advanceDate = (dateStr, days) => {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    state.scheduleStartDate = advanceDate(state.scheduleStartDate, 7);
    state.scheduleEndDate = advanceDate(state.scheduleEndDate, 7);
    document.getElementById('schedule-start-date').value = state.scheduleStartDate;
    document.getElementById('schedule-end-date').value = state.scheduleEndDate;
    generateSchedule(true);
}

async function generateSchedule(skipConfirm) {
    if (!skipConfirm && !confirm('Tem certeza que deseja gerar uma nova escala? A escala atual será substituída.')) return;

    if (state.people.length === 0 || state.shifts.length === 0) {
        alert("Adicione pessoas e horários primeiro!");
        return;
    }

    document.getElementById('ai-loading').classList.remove('hidden');
    syncConfigFromInputs();

    state.lastSchedule = JSON.parse(JSON.stringify(state.schedule));

    try {
        const provider = state.config.provider || 'openrouter';
        let usedApi = false;

        if (provider === 'openrouter' && state.config.openrouterKey) {
            usedApi = true;
            await callOpenRouterAPI();
        } else if (provider === 'gemini' && state.config.geminiKey) {
            usedApi = true;
            await callGeminiAPI();
        }

        if (!usedApi) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runLocalGenerationAlgorithm();
        }

        const days = getWorkingDays();
        state.shifts.forEach(shift => {
            days.forEach(day => {
                const key = `${shift.id}-${day}`;
                const assigned = state.schedule[key] || [];
                assigned.forEach(personId => {
                    state.shiftCounts[personId] = (state.shiftCounts[personId] || 0) + 1;
                });
            });
        });

        const removed = cleanScheduleConflicts();
        const days2 = getWorkingDays();
        let totalUnfilled = 0;
        state.shifts.forEach(shift => {
            days2.forEach(day => {
                const key = `${shift.id}-${day}`;
                const assigned = state.schedule[key] || [];
                totalUnfilled += Math.max(0, shift.capacity - assigned.length);
            });
        });

        saveState();
        saveScheduleToServer();
        renderScheduleBoard();
        switchTab('escala');

        const selectedPersonId = document.getElementById('select-person-schedule').value;
        if (selectedPersonId) {
            renderPersonalSchedule(selectedPersonId);
        }

        if (removed > 0 || totalUnfilled > 0) {
            let msg = '';
            if (removed > 0) msg += `${removed} conflito${removed !== 1 ? 's' : ''} removido${removed !== 1 ? 's' : ''} (indisponíveis/mesmo dia/excesso).\n`;
            if (totalUnfilled > 0) msg += `Faltam ~${Math.ceil(totalUnfilled / 5)} funcionário${Math.ceil(totalUnfilled / 5) !== 1 ? 's' : ''} para preencher ${totalUnfilled} vaga${totalUnfilled !== 1 ? 's' : ''}.`;
            alert(msg);
        }
    } catch (e) {
        console.error("Erro ao gerar:", e);
        alert("Ocorreu um erro ao gerar a escala: " + e.message);
    } finally {
        document.getElementById('ai-loading').classList.add('hidden');
    }
}
