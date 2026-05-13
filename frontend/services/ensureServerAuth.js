async function ensureServerAuth() {
    if (!state.currentUser) return false;
    syncConfigFromInputs();
    if (state.config.serverToken) return true;

    const email = generateEmail(state.currentUser.name);
    const password = state.currentUser.password || '3820';
    const serverUrl = state.config.serverUrl || 'http://localhost:3001';

    try {
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
            return true;
        }
    } catch (err) {
        console.log('Servidor não disponível:', err);
    }
    return false;
}
