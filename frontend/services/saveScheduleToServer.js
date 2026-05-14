async function saveScheduleToServer() {
    // Se não houver token ou URL, marcamos como precisando de sincronia e paramos
    if (!state.config.serverToken || !state.config.serverUrl) {
        state.needsSync = true;
        localStorage.setItem('escala_needs_sync', 'true');
        return;
    }

    try {
        const serverUrl = state.config.serverUrl;
        const response = await fetch(`${serverUrl}/api/schedule`, {
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

        if (response.ok) {
            // Sincronizado com sucesso!
            state.needsSync = false;
            localStorage.setItem('escala_needs_sync', 'false');
            console.log('Dados sincronizados com o servidor com sucesso.');
        } else {
            throw new Error('Erro na resposta do servidor');
        }
    } catch (err) {
        // Se falhar, garantimos que o flag de sincronia continue true
        state.needsSync = true;
        localStorage.setItem('escala_needs_sync', 'true');
        console.log('Servidor indisponível. Alterações salvas localmente e aguardando conexão.');
    }
}
