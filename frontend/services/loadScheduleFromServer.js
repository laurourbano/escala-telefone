async function loadScheduleFromServer() {
    if (!state.config.serverToken) return;

    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        const response = await fetch(`${serverUrl}/api/schedule`, {
            headers: { 'Authorization': `Bearer ${state.config.serverToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.schedule && Object.keys(data.schedule).length > 0) {
                state.schedule = data.schedule;
                if (data.start_date) state.scheduleStartDate = data.start_date;
                if (data.end_date) state.scheduleEndDate = data.end_date;
                saveState();
                renderScheduleBoard();
            }
            if (data.people && data.people.length > 0) {
                state.people = data.people;
                saveState();
                renderPeople();
            }
            if (data.shifts && data.shifts.length > 0) {
                state.shifts = data.shifts;
                saveState();
                renderShifts();
            }
        }
    } catch (err) {
        console.log('Servidor não disponível para carregar escala.');
    }
}
