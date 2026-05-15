async function syncLoginWithServer(email, password) {
    console.log('syncLoginWithServer: iniciando', email);
    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        let response = await fetch(`${serverUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.status === 401) {
            response = await fetch(`${serverUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
        }

        if (response.ok) {
            console.log('syncLoginWithServer: login/register ok');
            const data = await response.json();
            state.config.serverToken = data.token;
            state.config.serverUrl = serverUrl;
            console.log('syncLoginWithServer: token obtido, chamando saveState');
            saveState();
            console.log('syncLoginWithServer: chamando loadScheduleFromServer');
            await loadConfigFromServer();
            await loadScheduleFromServer();
            console.log('syncLoginWithServer: completo');
        }
    } catch (err) {
        console.log('Servidor não disponível, usando apenas local.', err);
    }
}
