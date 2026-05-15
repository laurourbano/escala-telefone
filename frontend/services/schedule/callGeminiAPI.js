async function callGeminiAPI() {
    const promptData = buildSchedulePrompt();

    const prompt = `Você é um gerador de escala de trabalho. Distribua as pessoas nos turnos respeitando todas as regras abaixo.

Regras:
1. São dias úteis (seg-sex), ignorar finais de semana e feriados
2. Respeitar a capacidade máxima de cada turno
3. Preferir respeitar o máximo de turnos por pessoa (maxShifts), mas permitir exceder quando necessário para preencher vagas
4. Não escalar pessoa que está em período de indisponibilidade
5. Preferir turnos preferenciais de cada pessoa (preferredShifts)
6. Distribuir a carga de forma equilibrada entre as pessoas
7. Uma pessoa NÃO pode estar em dois turnos diferentes no mesmo dia
8. A pessoa pode ficar vaga se não houver candidatos disponíveis
9. A escala desta semana DEVE ser DIFERENTE da semana anterior (lastWeekAssignments). Não repita a mesma pessoa no mesmo turno no mesmo dia da semana
10. Use shiftCounts (total de turnos acumulados por pessoa historicamente) para priorizar quem tem menos turnos, garantindo distribuição justa ao longo do tempo e compensando quem fez turno extra antes

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
