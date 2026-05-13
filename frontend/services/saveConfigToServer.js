async function saveConfigToServer() {
    const statusEl = document.getElementById('server-config-status');

    if (!state.config.serverToken) {
        statusEl.innerText = 'Autenticando no servidor...';
        statusEl.style.color = 'var(--text-muted)';
        const authed = await ensureServerAuth();
        if (!authed) {
            statusEl.innerText = 'Não foi possível autenticar no servidor. Verifique a URL.';
            statusEl.style.color = 'var(--danger)';
            return;
        }
    }

    syncConfigFromInputs();

    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        const response = await fetch(`${serverUrl}/api/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.config.serverToken}`
            },
            body: JSON.stringify({
                openrouter_key: state.config.openrouterKey || '',
                openrouter_model: state.config.openrouterModel || 'google/gemini-2.0-flash-exp',
                gemini_key: state.config.geminiKey || '',
                provider: state.config.provider || 'openrouter'
            })
        });

        if (response.ok) {
            statusEl.innerText = 'Configuração salva no servidor!';
            statusEl.style.color = 'var(--secondary)';
        } else if (response.status === 401) {
            state.config.serverToken = '';
            saveState();
            statusEl.innerText = 'Sessão expirada. Faça login novamente.';
            statusEl.style.color = 'var(--danger)';
        } else {
            statusEl.innerText = 'Erro ao salvar no servidor.';
            statusEl.style.color = 'var(--danger)';
        }
    } catch (err) {
        statusEl.innerText = 'Servidor não disponível.';
        statusEl.style.color = 'var(--danger)';
    }
}
