async function syncLoginWithServer(email, password) {
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
            const data = await response.json();
            state.config.serverToken = data.token;
            state.config.serverUrl = serverUrl;
            saveState();
            await loadConfigFromServer();
            await loadScheduleFromServer();
        }
    } catch (err) {
        console.log('Servidor não disponível, usando apenas local.');
    }
}
