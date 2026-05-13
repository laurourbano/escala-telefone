function switchTab(tabId) {
    menuButtons.forEach(function (button) { return button.classList.remove('active'); });
    document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
    panels.forEach(function (panel) { return panel.classList.add('hidden'); });
    document.getElementById('panel-' + tabId).classList.remove('hidden');
    if (tabId === 'minha-escala') {
        var selectGroup = document.getElementById('personal-select-group');
        if (isAdmin()) {
            selectGroup.style.display = 'block';
            populatePersonSelect();
        } else {
            selectGroup.style.display = 'none';
        }
        if (state.currentUser) {
            var select = document.getElementById('select-person-schedule');
            select.value = state.currentUser.id;
            renderPersonalSchedule(state.currentUser.id);
        }
    }
}
