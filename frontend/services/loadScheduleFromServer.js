function updateLocalStorage() {
    localStorage.setItem('escala_people', JSON.stringify(state.people));
    localStorage.setItem('escala_shifts', JSON.stringify(state.shifts));
    localStorage.setItem('escala_schedule', JSON.stringify(state.schedule));
    localStorage.setItem('escala_start_date', state.scheduleStartDate);
    localStorage.setItem('escala_end_date', state.scheduleEndDate);
    localStorage.setItem('escala_closed_dates', JSON.stringify(state.closedDates));
    localStorage.setItem('escala_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('escala_last_schedule', JSON.stringify(state.lastSchedule));
    localStorage.setItem('escala_shift_counts', JSON.stringify(state.shiftCounts));
}

async function loadStateFromServer() {
    if (!state.config.serverToken || !state.config.serverUrl) return;

    try {
        updateSyncStatus('syncing');
        const serverUrl = state.config.serverUrl;
        const response = await fetch(`${serverUrl}/api/appdata`, {
            headers: { 'Authorization': `Bearer ${state.config.serverToken}` }
        });

        if (response.ok) {
            const data = await response.json();

            let updated = false;

            if (data.schedule && Object.keys(data.schedule).length > 0) {
                state.schedule = data.schedule;
                if (data.start_date) state.scheduleStartDate = data.start_date;
                if (data.end_date) state.scheduleEndDate = data.end_date;
                updated = true;
            }
            if (data.people && data.people.length > 0) {
                state.people = data.people;
                updated = true;
            }
            if (data.shifts && data.shifts.length > 0) {
                state.shifts = data.shifts;
                updated = true;
            }
            if (data.closed_dates) {
                state.closedDates = data.closed_dates;
                updated = true;
            }
            if (data.notifications) {
                state.notifications = data.notifications;
            }
            if (data.last_schedule) {
                state.lastSchedule = data.last_schedule;
            }
            if (data.shift_counts) {
                state.shiftCounts = data.shift_counts;
            }
            if (data.config) {
                state.config.openrouterKey = data.config.openrouter_key || '';
                state.config.openrouterModel = data.config.openrouter_model || '';
                state.config.geminiKey = data.config.gemini_key || '';
                state.config.provider = data.config.provider || 'openrouter';
            }
            if (data.current_user) {
                state.currentUser = data.current_user;
            }

            if (updated) {
                state.needsSync = false;
                localStorage.setItem('escala_needs_sync', 'false');
                updateSyncStatus('online');

                updateLocalStorage();

                renderPeople();
                renderShifts();
                renderScheduleBoard();
                validateSchedule();
                populatePersonSelect();
            } else {
                updateSyncStatus('online');
            }
        } else {
            updateSyncStatus('offline');
        }
    } catch (err) {
        updateSyncStatus('offline');
        console.log('Servidor indisponível no momento.');
    }
}

// Mantém o nome antigo como alias para compatibilidade
async function loadScheduleFromServer() {
    return loadStateFromServer();
}
