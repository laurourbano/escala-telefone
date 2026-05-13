async function saveScheduleToServer() {
    if (!state.config.serverToken) {
        const authed = await ensureServerAuth();
        if (!authed) return;
    }

    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        await fetch(`${serverUrl}/api/schedule`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.config.serverToken}`
            },
            body: JSON.stringify({
                schedule: state.schedule,
                start_date: state.scheduleStartDate,
                end_date: state.scheduleEndDate,
                people: state.people,
                shifts: state.shifts
            })
        });
    } catch (err) {
        console.log('Servidor não disponível para salvar escala.');
    }
}
