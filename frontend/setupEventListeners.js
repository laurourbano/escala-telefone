function setupEventListeners() {
    menuButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            switchTab(button.dataset.tab);
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('expanded');
            }
        });
    });
    var toggleButton = document.getElementById('btn-toggle-sidebar');
    if (toggleButton) {
        toggleButton.addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('expanded');
        });
    }
    var buttonSelectAll = document.getElementById('btn-select-all-shifts');
    var buttonDeselectAll = document.getElementById('btn-deselect-all-shifts');
    if (buttonSelectAll) {
        buttonSelectAll.addEventListener('click', function () {
            document.querySelectorAll('input[name="pref-shifts"]').forEach(function (cb) { cb.checked = true; });
        });
    }
    if (buttonDeselectAll) {
        buttonDeselectAll.addEventListener('click', function () {
            document.querySelectorAll('input[name="pref-shifts"]').forEach(function (cb) { cb.checked = false; });
        });
    }
    document.getElementById('btn-notifications').addEventListener('click', function () {
        renderNotifications();
        document.getElementById('modal-notifications').classList.add('active');
    });
    document.getElementById('swap-target-person').addEventListener('change', function (event) {
        updateSwapTargetShifts(event.target.value);
    });
    document.getElementById('form-swap').addEventListener('submit', handleSwapRequest);
    document.getElementById('btn-add-person').addEventListener('click', function () { openPersonModal(); });
    document.getElementById('btn-add-shift').addEventListener('click', function () { openShiftModal(); });
    document.querySelectorAll('.close-modal').forEach(function (button) {
        button.addEventListener('click', function (event) { event.target.closest('.modal-overlay').classList.remove('active'); });
    });
    document.getElementById('form-person').addEventListener('submit', savePerson);
    document.getElementById('form-shift').addEventListener('submit', saveShift);
    aiOpenrouterKeyInput.addEventListener('input', function (e) {
        state.config.openrouterKey = e.target.value;
        saveState();
    });
    aiOpenrouterModelSelect.addEventListener('change', function (e) {
        state.config.openrouterModel = e.target.value;
        saveState();
    });
    aiGeminiKeyInput.addEventListener('input', function (e) {
        state.config.geminiKey = e.target.value;
        saveState();
    });
    providerRadios.forEach(function (radio) {
        radio.addEventListener('change', function (e) {
            state.config.provider = e.target.value;
            toggleProviderConfig(e.target.value);
            saveState();
        });
    });
    serverUrlInput.addEventListener('change', function (e) {
        state.config.serverUrl = e.target.value;
        saveState();
    });
    btnSaveServer.addEventListener('click', saveConfigToServer);
    btnLoadServer.addEventListener('click', loadConfigFromServer);
    scheduleStartDateInput.addEventListener('change', function (e) {
        var newDate = e.target.value;
        if (newDate) {
            state.scheduleStartDate = newDate;
            var defaultEnd = calculateDefaultEndDate(newDate);
            state.scheduleEndDate = defaultEnd;
            scheduleEndDateInput.value = defaultEnd;
            saveState();
            renderScheduleBoard();
        }
    });
    scheduleEndDateInput.addEventListener('change', function (e) {
        var newEnd = e.target.value;
        if (newEnd) {
            if (state.scheduleStartDate && newEnd < state.scheduleStartDate) {
                alert('A data final nao pode ser anterior a data inicial.');
                scheduleEndDateInput.value = state.scheduleEndDate;
                return;
            }
            state.scheduleEndDate = newEnd;
            saveState();
            renderScheduleBoard();
        }
    });
    btnAddClosedDate.addEventListener('click', function () {
        var date = inputClosedDate.value;
        if (date && state.closedDates.indexOf(date) === -1) {
            state.closedDates.push(date);
            state.closedDates.sort();
            saveState();
            renderClosedDates();
            renderScheduleBoard();
        }
        inputClosedDate.value = '';
    });
    btnFetchHolidays.addEventListener('click', async function () {
        try {
            var year = state.scheduleStartDate ? state.scheduleStartDate.split('-')[0] : new Date().getFullYear();
            var response = await fetch('https://brasilapi.com.br/api/feriados/v1/' + year);
            var holidays = await response.json();
            var added = 0;
            holidays.forEach(function (holiday) {
                if (state.closedDates.indexOf(holiday.date) === -1) {
                    state.closedDates.push(holiday.date);
                    added++;
                }
            });
            if (added > 0) {
                state.closedDates.sort();
                saveState();
                renderClosedDates();
                renderScheduleBoard();
                alert(added + ' feriados nacionais adicionados.');
            } else {
                alert('Nenhum feriado novo para adicionar neste periodo.');
            }
        } catch (error) {
            alert('Erro ao buscar feriados da BrasilAPI.');
        }
    });
    document.getElementById('btn-generate').addEventListener('click', generateSchedule);
    document.getElementById('btn-next-week').addEventListener('click', generateNextWeek);
    document.getElementById('btn-export').addEventListener('click', exportSchedulePDF);
    document.getElementById('select-person-schedule').addEventListener('change', function (e) {
        renderPersonalSchedule(e.target.value);
    });
    document.getElementById('btn-export-personal').addEventListener('click', function () {
        var personId = document.getElementById('select-person-schedule').value;
        if (!personId) {
            alert('Selecione um nome primeiro!');
            return;
        }
        window.print();
    });
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-profile').addEventListener('click', function () {
        document.getElementById('profile-dropdown').classList.toggle('active');
    });
    document.getElementById('btn-open-change-pw').addEventListener('click', openChangePasswordModal);
    document.getElementById('form-change-password').addEventListener('submit', handleChangePassword);
    document.querySelectorAll('.toggle-password').forEach(function (button) {
        button.addEventListener('click', function () {
            var targetId = button.dataset.target;
            var input = document.getElementById(targetId);
            var icon = button.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'ph ph-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'ph ph-eye';
            }
        });
    });
    window.addEventListener('click', function (e) {
        if (!e.target.closest('#topbar-user-actions')) {
            document.getElementById('profile-dropdown').classList.remove('active');
        }
    });
}
