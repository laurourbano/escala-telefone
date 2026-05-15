async function saveState() {
    if (typeof saveStateToServer === 'function') {
        try {
            await saveStateToServer();
        } catch (err) {
            console.log('Erro ao salvar no servidor:', err);
        }
    }
}
