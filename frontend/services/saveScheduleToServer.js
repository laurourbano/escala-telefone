async function saveStateToServer() {
    console.log('saveStateToServer: token?', !!state.config.serverToken, 'url?', !!state.config.serverUrl, 'people:', state.people.length, 'shifts:', state.shifts.length);
    if (!state.config.serverToken || !state.config.serverUrl) {
        updateSyncStatus('offline');
        return;
    }

    try {
        updateSyncStatus('syncing');
        const serverUrl = state.config.serverUrl;
        console.log('saveStateToServer: PUT /api/appdata');
        const response = await fetch(`${serverUrl}/api/appdata`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.config.serverToken}`
            },
            body: JSON.stringify({
                people: state.people,
                shifts: state.shifts,
                schedule: state.schedule,
                config: {
                    openrouter_key: state.config.openrouterKey || '',
                    openrouter_model: state.config.openrouterModel || '',
                    gemini_key: state.config.geminiKey || '',
                    provider: state.config.provider || 'openrouter',
                    serverUrl: state.config.serverUrl || '',
                    serverToken: state.config.serverToken || ''
                },
                start_date: state.scheduleStartDate,
                end_date: state.scheduleEndDate,
                closed_dates: state.closedDates,
                current_user: state.currentUser,
                notifications: state.notifications,
                last_schedule: state.lastSchedule,
                shift_counts: state.shiftCounts
            })
        });

        if (response.ok) {
            state.needsSync = false;
            localStorage.setItem('escala_needs_sync', 'false');
            updateSyncStatus('online');
        } else {
            state.needsSync = true;
            localStorage.setItem('escala_needs_sync', 'true');
            updateSyncStatus('offline');
        }
    } catch (err) {
        state.needsSync = true;
        localStorage.setItem('escala_needs_sync', 'true');
        updateSyncStatus('offline');
        console.log('Servidor indisponível. Não foi possível salvar.');
    }
}

// Mantém o nome antigo como alias para compatibilidade
async function saveScheduleToServer() {
    return saveStateToServer();
}
