async function generateSchedule(skipConfirm) {
    if (!skipConfirm) {
        showConfirm(
            'Tem certeza que deseja gerar uma nova escala?',
            'A escala atual será substituída.',
            () => generateSchedule(true)
        );
        return;
    }

    if (state.people.length === 0 || state.shifts.length === 0) {
        showToast("Adicione pessoas e horários primeiro!", "warning");
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
            showToast(msg, "warning");
        }
    } catch (e) {
        console.error("Erro ao gerar:", e);
        showToast("Ocorreu um erro ao gerar a escala: " + e.message, "error");
    } finally {
        document.getElementById('ai-loading').classList.add('hidden');
    }
}
