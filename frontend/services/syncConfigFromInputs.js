function syncConfigFromInputs() {
    if (aiOpenrouterKeyInput) state.config.openrouterKey = aiOpenrouterKeyInput.value;
    if (aiOpenrouterModelSelect) state.config.openrouterModel = aiOpenrouterModelSelect.value;
    if (aiGeminiKeyInput) state.config.geminiKey = aiGeminiKeyInput.value;
    if (serverUrlInput) state.config.serverUrl = serverUrlInput.value;
    const checkedProvider = document.querySelector('input[name="ai-provider"]:checked');
    if (checkedProvider) state.config.provider = checkedProvider.value;
}
