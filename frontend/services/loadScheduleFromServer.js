async function loadScheduleFromServer() {
    if (!state.config.serverToken || !state.config.serverUrl) return;

    try {
        updateSyncStatus('syncing');
        const serverUrl = state.config.serverUrl;
        console.log('Buscando dados do servidor...');
        const response = await fetch(`${serverUrl}/api/schedule`, {
            headers: { 'Authorization': `Bearer ${state.config.serverToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            updateSyncStatus('online');
            
            // ... (rest of the logic)
            
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

            if (updated) {
                console.log('Dados carregados do servidor com sucesso.');
                // Ao carregar do servidor, assumimos que estamos sincronizados
                state.needsSync = false;
                localStorage.setItem('escala_needs_sync', 'false');
                updateSyncStatus('online');
                
                // Salva no localStorage como backup
                saveState(); 
                
                // Atualiza a UI
                renderPeople();
                renderShifts();
                renderScheduleBoard();
                validateSchedule();
                populatePersonSelect();
            } else if (state.needsSync) {
                // Se o servidor está vazio mas temos dados locais pendentes, enviamos agora
                console.log('Servidor vazio, enviando dados locais pendentes...');
                saveScheduleToServer();
            }
        }
    } catch (err) {
        updateSyncStatus('offline');
        console.log('Servidor indisponível no momento. Usando backup local.');
    }
}
