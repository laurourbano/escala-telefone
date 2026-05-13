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
            loadConfigFromServer();
            loadScheduleFromServer();
        }
    } catch (err) {
        console.log('Servidor não disponível, usando apenas local.');
    }
}

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
        }
    } catch (err) {
        console.log('Servidor não disponível para carregar escala.');
    }
}
