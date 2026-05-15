async function init() {
    // Load dynamic components
    await Promise.all([
        loadComponent('dynamic-components', 'frontend/components/toast/toast.html'),
        loadComponent('dynamic-components', 'frontend/components/confirm/confirm.html'),
        loadComponent('dynamic-components', 'frontend/components/login/login.html'),
        loadComponent('dynamic-components', 'frontend/components/person-modal/person-modal.html'),
        loadComponent('dynamic-components', 'frontend/components/shift-modal/shift-modal.html'),
        loadComponent('dynamic-components', 'frontend/components/swap-modal/swap-modal.html'),
        loadComponent('dynamic-components', 'frontend/components/notifications-modal/notifications-modal.html'),
        loadComponent('dynamic-components', 'frontend/components/change-password-modal/change-password-modal.html'),
        loadComponent('dynamic-components', 'frontend/components/ai-loading/ai-loading.html'),
        loadComponent('dynamic-components', 'frontend/components/bulk-status/bulk-status.html')
    ]);



    if (state.config.serverToken && state.config.serverUrl) {

        await loadStateFromServer();
    }

    if (!state.scheduleStartDate) {
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        state.scheduleStartDate = nextMonday.toISOString().split('T')[0];
        const nextFriday = new Date(nextMonday);
        nextFriday.setDate(nextMonday.getDate() + 4);
        state.scheduleEndDate = nextFriday.toISOString().split('T')[0];
    }

    sortShifts();
    state.people.forEach(function (person) {
        if (person.name) person.name = toTitleCase(person.name);
        if (person.maxShifts === undefined || isNaN(person.maxShifts)) person.maxShifts = 4;
        if (!person.preferredShifts || person.preferredShifts.length === 0) {
            person.preferredShifts = state.shifts.map(function (shift) { return shift.id; });
        }
    });
    renderPeople();
    renderShifts();
    scheduleStartDateInput.value = state.scheduleStartDate;
    scheduleEndDateInput.value = state.scheduleEndDate;
    renderClosedDates();
    renderScheduleBoard();
    setupEventListeners();
    aiOpenrouterKeyInput.value = state.config.openrouterKey || '';
    aiOpenrouterModelSelect.value = state.config.openrouterModel || 'google/gemini-2.0-flash-exp';
    aiGeminiKeyInput.value = state.config.geminiKey || '';
    serverUrlInput.value = state.config.serverUrl || 'http://localhost:3001';
    var provider = state.config.provider || 'openrouter';
    document.querySelector('input[name="ai-provider"][value="' + provider + '"]').checked = true;
    toggleProviderConfig(provider);
    validateSchedule();
    populatePersonSelect();
    checkAuth();
    saveState();

    setInterval(function() {
        if (state.needsSync && typeof saveStateToServer === 'function') {
            saveStateToServer().catch(function() {});
        }
    }, 30000);

    window.addEventListener('online', function() {
        if (state.needsSync) saveStateToServer().catch(function() {});
    });
}

document.addEventListener('DOMContentLoaded', init);
