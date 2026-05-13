function init() {
    sortShifts();
    state.people.forEach(function (person) {
        if (person.name) person.name = toTitleCase(person.name);
        if (person.maxShifts === undefined || isNaN(person.maxShifts)) person.maxShifts = 5;
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
    loadScheduleFromServer().catch(function () {});
}

document.addEventListener('DOMContentLoaded', init);
