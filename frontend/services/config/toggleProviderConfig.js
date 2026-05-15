function toggleProviderConfig(provider) {
    document.getElementById('config-openrouter').style.display = provider === 'openrouter' ? 'block' : 'none';
    document.getElementById('config-gemini').style.display = provider === 'gemini' ? 'block' : 'none';
}
