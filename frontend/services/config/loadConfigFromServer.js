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
