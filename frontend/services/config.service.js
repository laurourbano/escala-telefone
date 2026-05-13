function syncConfigFromInputs() {
    if (aiOpenrouterKeyInput) state.config.openrouterKey = aiOpenrouterKeyInput.value;
    if (aiOpenrouterModelSelect) state.config.openrouterModel = aiOpenrouterModelSelect.value;
    if (aiGeminiKeyInput) state.config.geminiKey = aiGeminiKeyInput.value;
    if (serverUrlInput) state.config.serverUrl = serverUrlInput.value;
    const checkedProvider = document.querySelector('input[name="ai-provider"]:checked');
    if (checkedProvider) state.config.provider = checkedProvider.value;
    saveState();
}

function toggleProviderConfig(provider) {
    document.getElementById('config-openrouter').style.display = provider === 'openrouter' ? 'block' : 'none';
    document.getElementById('config-gemini').style.display = provider === 'gemini' ? 'block' : 'none';
}

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

async function loadConfigFromServer() {
    const statusEl = document.getElementById('server-config-status');
    if (!state.config.serverToken) return;

    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        const response = await fetch(`${serverUrl}/api/config`, {
            headers: { 'Authorization': `Bearer ${state.config.serverToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.openrouter_key) state.config.openrouterKey = data.openrouter_key;
            if (data.openrouter_model) state.config.openrouterModel = data.openrouter_model;
            if (data.gemini_key) state.config.geminiKey = data.gemini_key;
            if (data.provider) state.config.provider = data.provider;
            saveState();

            aiOpenrouterKeyInput.value = state.config.openrouterKey;
            if (data.openrouter_model) aiOpenrouterModelSelect.value = state.config.openrouterModel;
            aiGeminiKeyInput.value = state.config.geminiKey;
            if (data.provider) {
                const radio = document.querySelector(`input[name="ai-provider"][value="${state.config.provider}"]`);
                if (radio) radio.checked = true;
                toggleProviderConfig(state.config.provider);
            }

            statusEl.innerText = 'Configuração carregada do servidor!';
            statusEl.style.color = 'var(--secondary)';
        } else if (response.status === 401) {
            state.config.serverToken = '';
            saveState();
        }
    } catch (err) {
        console.log('Servidor não disponível para carregar config.');
    }
}
