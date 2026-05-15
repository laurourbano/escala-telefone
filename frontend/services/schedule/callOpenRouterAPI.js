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
