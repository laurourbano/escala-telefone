/**
 * @typedef {Object} Person
 * @property {string} id
 * @property {string} name
 * @property {string} status
 * @property {number} maxShifts
 * @property {string[]} preferredShifts
 * @property {string} password
 * @property {string} [unavailabilityStart]
 * @property {string} [unavailabilityEnd]
 */

/**
 * @typedef {Object} Shift
 * @property {string} id
 * @property {string} name
 * @property {string} time
 * @property {number} capacity
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} fromId
 * @property {string} fromName
 * @property {string} toId
 * @property {string} myShiftId
 * @property {string} myDate
 * @property {string} targetShiftId
 * @property {string} targetDate
 * @property {string} status
 * @property {string} timestamp
 */

/**
 * @type {{
 *  people: Person[],
 *  shifts: Shift[],
 *  schedule: Object.<string, string[]>,
 *  config: { apiKey: string, openrouterKey: string, openrouterModel: string, geminiKey: string, provider: string, serverUrl: string, serverToken: string },
 *  scheduleStartDate: string,
 *  scheduleEndDate: string,
 *  closedDates: string[],
 *  currentUser: Person | null,
 *  notifications: Notification[]
 * }}
 */
let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { apiKey: '', openrouterKey: '', openrouterModel: 'google/gemini-2.0-flash-001', geminiKey: '', provider: 'openrouter', serverUrl: 'http://localhost:3001', serverToken: '' },
    scheduleStartDate: localStorage.getItem('escala_start_date') || '',
    scheduleEndDate: localStorage.getItem('escala_end_date') || '',
    closedDates: JSON.parse(localStorage.getItem('escala_closed_dates')) || [],
    currentUser: JSON.parse(localStorage.getItem('escala_current_user')) || null,
    notifications: JSON.parse(localStorage.getItem('escala_notifications')) || []
};

// Ensure all people have a password (default 3820) and isAdmin field
state.people.forEach(person => {
    if (!person.password) person.password = '3820';
    if (person.isAdmin === undefined) person.isAdmin = false;
});
saveState();

if (!state.scheduleStartDate) {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    state.scheduleStartDate = nextMonday.toISOString().split('T')[0];
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    state.scheduleEndDate = nextFriday.toISOString().split('T')[0];
}

// Migration check for old schedule format
if (Object.keys(state.schedule).length > 0) {
    const firstKey = Object.keys(state.schedule)[0];
    if (firstKey.includes('-Segunda')) {
        state.schedule = {};
    }
}

// UUID Generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// DOM Elements
const panels = document.querySelectorAll('.panel');
const menuButtons = document.querySelectorAll('.menu-btn');
const peopleList = document.getElementById('people-list');
const shiftsList = document.getElementById('shifts-list');
const scheduleBoard = document.getElementById('schedule-board');
const aiOpenrouterKeyInput = document.getElementById('ai-openrouter-key');
const aiOpenrouterModelSelect = document.getElementById('ai-openrouter-model');
const aiGeminiKeyInput = document.getElementById('ai-gemini-key');
const providerRadios = document.querySelectorAll('input[name="ai-provider"]');
const serverUrlInput = document.getElementById('server-url');
const btnSaveServer = document.getElementById('btn-save-server-config');
const btnLoadServer = document.getElementById('btn-load-server-config');
const serverConfigStatus = document.getElementById('server-config-status');

const scheduleStartDateInput = document.getElementById('schedule-start-date');
const scheduleEndDateInput = document.getElementById('schedule-end-date');
const inputClosedDate = document.getElementById('input-closed-date');
const btnAddClosedDate = document.getElementById('btn-add-closed-date');
const btnFetchHolidays = document.getElementById('btn-fetch-holidays');
const closedDatesList = document.getElementById('closed-dates-list');

// Initialize
function init() {
    sortShifts(); // Guarantee shifts are sorted initially

    // Ensure all names are capitalized (Title Case) and apply defaults
    state.people.forEach(person => {
        if (person.name) person.name = toTitleCase(person.name);
        if (person.maxShifts === undefined || isNaN(person.maxShifts)) person.maxShifts = 5;
        if (!person.preferredShifts || person.preferredShifts.length === 0) {
            person.preferredShifts = state.shifts.map(shift => shift.id);
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
    aiOpenrouterModelSelect.value = state.config.openrouterModel || 'google/gemini-2.0-flash-001';
    aiGeminiKeyInput.value = state.config.geminiKey || '';
    serverUrlInput.value = state.config.serverUrl || 'http://localhost:3001';

    // Set provider radio
    const provider = state.config.provider || 'openrouter';
    document.querySelector(`input[name="ai-provider"][value="${provider}"]`).checked = true;
    toggleProviderConfig(provider);

    validateSchedule();
    populatePersonSelect();
    checkAuth();
}

function checkAuth() {
    if (state.currentUser) {
        document.getElementById('login-overlay').classList.remove('active');
        document.getElementById('topbar-user-actions').style.display = 'flex';
        document.getElementById('display-user-name').innerText = getFirstName(state.currentUser.name);

        // Admin visibility
        const adminTabs = document.querySelectorAll('[data-tab="pessoas"], [data-tab="horarios"], [data-tab="config"]');
        if (isAdmin()) {
            adminTabs.forEach(tab => tab.classList.remove('hidden-admin'));
        } else {
            adminTabs.forEach(tab => tab.classList.add('hidden-admin'));
        }

        updateNotificationBadge();
    } else {
        document.getElementById('login-overlay').classList.add('active');
        document.getElementById('topbar-user-actions').style.display = 'none';
    }
}

function toggleProviderConfig(provider) {
    document.getElementById('config-openrouter').style.display = provider === 'openrouter' ? 'block' : 'none';
    document.getElementById('config-gemini').style.display = provider === 'gemini' ? 'block' : 'none';
}

// Sort shifts by start time and name
function sortShifts() {
    state.shifts.sort((shiftA, shiftB) => {
        const timeA = (shiftA.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        const timeB = (shiftB.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        if (timeA === timeB) {
            return shiftA.name.localeCompare(shiftB.name);
        }
        return timeA.localeCompare(timeB);
    });
}

function isAdmin() {
    if (!state.currentUser) return false;
    // Owner always has admin (hardcoded fallback)
    if (generateEmail(state.currentUser.name) === 'lauro.urbano@crf-pr.org.br') return true;
    return state.currentUser.isAdmin === true;
}

function toTitleCase(text) {
    if (!text) return '';
    return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getFirstName(name) {
    if (!name) return '';
    return name.split(' ')[0];
}

// Persist State
function saveState() {
    localStorage.setItem('escala_people', JSON.stringify(state.people));
    localStorage.setItem('escala_shifts', JSON.stringify(state.shifts));
    localStorage.setItem('escala_schedule', JSON.stringify(state.schedule));
    localStorage.setItem('escala_config', JSON.stringify(state.config));
    localStorage.setItem('escala_start_date', state.scheduleStartDate);
    localStorage.setItem('escala_end_date', state.scheduleEndDate);
    localStorage.setItem('escala_closed_dates', JSON.stringify(state.closedDates));
    localStorage.setItem('escala_current_user', JSON.stringify(state.currentUser));
}

// Date Helpers
function getWorkingDays() {
    const days = [];
    if (!state.scheduleStartDate || !state.scheduleEndDate) return days;

    let current = new Date(state.scheduleStartDate + 'T00:00:00');
    const end = new Date(state.scheduleEndDate + 'T00:00:00');

    if (isNaN(current.getTime()) || isNaN(end.getTime())) return days;
    if (current > end) return days; // Evita loop ou processamento se início for após fim

    let iterations = 0;
    while (current <= end && iterations < 62) { // Limite de 2 meses para segurança
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !state.closedDates.includes(dateStr)) {
            days.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
        iterations++;
    }
    return days;
}

function calculateDefaultEndDate(startDateStr) {
    let date = new Date(startDateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return '';

    let count = 0;
    let current = new Date(date);

    // Queremos 5 dias úteis incluindo o dia de início se for útil
    while (count < 5) {
        if (current.getDay() !== 0 && current.getDay() !== 6) {
            count++;
        }
        if (count < 5) {
            current.setDate(current.getDate() + 1);
        }
    }
    return current.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${day}/${month} (${dayNames[date.getDay()]})`;
}

function generateEmail(name) {
    const emailParts = name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim()
        .split(/\s+/);

    if (emailParts.length > 1) {
        return `${emailParts[0]}.${emailParts[emailParts.length - 1]}@crf-pr.org.br`;
    }
    return `${emailParts[0]}@crf-pr.org.br`;
}

function isPersonUnavailable(person, dateStr) {
    if (person.status === 'disponivel') return false;

    if (person.unavailabilityStart && person.unavailabilityEnd) {
        return dateStr >= person.unavailabilityStart && dateStr <= person.unavailabilityEnd;
    } else if (person.unavailabilityStart) {
        return dateStr >= person.unavailabilityStart;
    } else if (person.unavailabilityEnd) {
        return dateStr <= person.unavailabilityEnd;
    }
    return true; // Unavailable indefinitely
}

function renderClosedDates() {
    closedDatesList.innerHTML = state.closedDates.map(date => `
        <div class="badge" style="background: var(--bg-card-hover); border: 1px solid var(--border); color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; padding: 0.25rem 0.5rem;">
            ${formatDate(date)}
            <button onclick="removeClosedDate('${date}')" style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 0; line-height: 1;"><i class="ph ph-x"></i></button>
        </div>
    `).join('');
}

function removeClosedDate(date) {
    state.closedDates = state.closedDates.filter(closedDate => closedDate !== date);
    saveState();
    renderClosedDates();
    renderScheduleBoard();
}

// Navigation
function switchTab(tabId) {
    menuButtons.forEach(button => button.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    panels.forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`panel-${tabId}`).classList.remove('hidden');

    if (tabId === 'minha-escala') {
        populatePersonSelect();
        if (state.currentUser) {
            const select = document.getElementById('select-person-schedule');
            select.value = state.currentUser.id;
            renderPersonalSchedule(state.currentUser.id);
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Menu
    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
            // Optionally close sidebar on mobile after selection
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('expanded');
            }
        });
    });

    const toggleButton = document.getElementById('btn-toggle-sidebar');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('expanded');
        });
    }

    // Person Modal Select/Deselect All
    const buttonSelectAll = document.getElementById('btn-select-all-shifts');
    const buttonDeselectAll = document.getElementById('btn-deselect-all-shifts');

    if (buttonSelectAll) {
        buttonSelectAll.addEventListener('click', () => {
            document.querySelectorAll('input[name="pref-shifts"]').forEach(checkbox => checkbox.checked = true);
        });
    }

    if (buttonDeselectAll) {
        buttonDeselectAll.addEventListener('click', () => {
            document.querySelectorAll('input[name="pref-shifts"]').forEach(checkbox => checkbox.checked = false);
        });
    }

    document.getElementById('btn-notifications').addEventListener('click', () => {
        renderNotifications();
        document.getElementById('modal-notifications').classList.add('active');
    });

    document.getElementById('swap-target-person').addEventListener('change', (event) => {
        updateSwapTargetShifts(event.target.value);
    });

    document.getElementById('form-swap').addEventListener('submit', handleSwapRequest);

    // Modals
    document.getElementById('btn-add-person').addEventListener('click', () => openPersonModal());
    document.getElementById('btn-add-shift').addEventListener('click', () => openShiftModal());
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (event) => event.target.closest('.modal-overlay').classList.remove('active'));
    });

    // Forms
    document.getElementById('form-person').addEventListener('submit', savePerson);
    document.getElementById('form-shift').addEventListener('submit', saveShift);

    // Config
    aiOpenrouterKeyInput.addEventListener('change', (e) => {
        state.config.openrouterKey = e.target.value;
        saveState();
    });

    aiOpenrouterModelSelect.addEventListener('change', (e) => {
        state.config.openrouterModel = e.target.value;
        saveState();
    });

    aiGeminiKeyInput.addEventListener('change', (e) => {
        state.config.geminiKey = e.target.value;
        saveState();
    });

    providerRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.config.provider = e.target.value;
            toggleProviderConfig(e.target.value);
            saveState();
        });
    });

    serverUrlInput.addEventListener('change', (e) => {
        state.config.serverUrl = e.target.value;
        saveState();
    });

    btnSaveServer.addEventListener('click', saveConfigToServer);
    btnLoadServer.addEventListener('click', loadConfigFromServer);

    scheduleStartDateInput.addEventListener('change', (e) => {
        const newDate = e.target.value;
        if (newDate) {
            state.scheduleStartDate = newDate;

            // Sugere data final (5 dias úteis depois)
            const defaultEnd = calculateDefaultEndDate(newDate);
            state.scheduleEndDate = defaultEnd;
            scheduleEndDateInput.value = defaultEnd;

            saveState();
            renderScheduleBoard();
        }
    });

    scheduleEndDateInput.addEventListener('change', (e) => {
        const newEnd = e.target.value;
        if (newEnd) {
            if (state.scheduleStartDate && newEnd < state.scheduleStartDate) {
                alert("A data final não pode ser anterior à data inicial.");
                scheduleEndDateInput.value = state.scheduleEndDate;
                return;
            }
            state.scheduleEndDate = newEnd;
            saveState();
            renderScheduleBoard();
        }
    });

    btnAddClosedDate.addEventListener('click', () => {
        const date = inputClosedDate.value;
        if (date && !state.closedDates.includes(date)) {
            state.closedDates.push(date);
            state.closedDates.sort();
            saveState();
            renderClosedDates();
            renderScheduleBoard();
        }
        inputClosedDate.value = '';
    });

    btnFetchHolidays.addEventListener('click', async () => {
        try {
            const year = state.scheduleStartDate ? state.scheduleStartDate.split('-')[0] : new Date().getFullYear();
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            const holidays = await response.json();
            let added = 0;
            holidays.forEach(holiday => {
                if (!state.closedDates.includes(holiday.date)) {
                    state.closedDates.push(holiday.date);
                    added++;
                }
            });
            if (added > 0) {
                state.closedDates.sort();
                saveState();
                renderClosedDates();
                renderScheduleBoard();
                alert(`${added} feriados nacionais adicionados.`);
            } else {
                alert("Nenhum feriado novo para adicionar neste período.");
            }
        } catch (error) {
            alert("Erro ao buscar feriados da BrasilAPI.");
        }
    });

    // Actions
    document.getElementById('btn-generate').addEventListener('click', generateSchedule);
    document.getElementById('btn-export').addEventListener('click', exportSchedulePDF);

    document.getElementById('select-person-schedule').addEventListener('change', (e) => {
        renderPersonalSchedule(e.target.value);
    });

    document.getElementById('btn-export-personal').addEventListener('click', () => {
        const personId = document.getElementById('select-person-schedule').value;
        if (!personId) {
            alert("Selecione um nome primeiro!");
            return;
        }
        window.print();
    });

    // Auth Listeners
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-profile').addEventListener('click', () => {
        document.getElementById('profile-dropdown').classList.toggle('active');
    });
    document.getElementById('btn-open-change-pw').addEventListener('click', openChangePasswordModal);
    document.getElementById('form-change-password').addEventListener('submit', handleChangePassword);

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'ph ph-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'ph ph-eye';
            }
        });
    });

    // Close dropdown on click outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('#topbar-user-actions')) {
            document.getElementById('profile-dropdown').classList.remove('active');
        }
    });
}

// Sort people alphabetically
function sortPeople() {
    state.people.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
}

// Render People
function renderPeople() {
    sortPeople();
    peopleList.innerHTML = '';
    const currentIsAdmin = isAdmin();
    state.people.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card';
        const isOwner = generateEmail(person.name) === 'lauro.urbano@crf-pr.org.br';
        const adminBadge = person.isAdmin || isOwner
            ? `<span class="badge" style="background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.5); color: #ca8a04;"><i class="ph ph-crown-simple"></i> Admin</span>`
            : '';
        const toggleAdminBtn = currentIsAdmin && !isOwner
            ? `<button title="${person.isAdmin ? 'Remover admin' : 'Tornar admin'}" onclick="toggleAdmin('${person.id}')" style="color: ${person.isAdmin ? 'var(--danger)' : 'var(--accent)'};"><i class="ph ph-crown-simple"></i></button>`
            : '';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${getFirstName(person.name)}</span>
                <div class="card-actions">
                    ${toggleAdminBtn}
                    <button onclick="editPerson('${person.id}')"><i class="ph ph-pencil"></i></button>
                    <button class="delete-btn" onclick="deletePerson('${person.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="card-meta" style="flex-wrap: wrap;">
                <span class="badge ${person.status}">${person.status}</span>
                ${adminBadge}
                ${person.status !== 'disponivel' && (person.unavailabilityStart || person.unavailabilityEnd) ?
                `<span class="badge" style="background: var(--bg-card); border: 1px solid var(--border);">
                        ${person.unavailabilityStart ? formatDate(person.unavailabilityStart) : '...'} - 
                        ${person.unavailabilityEnd ? formatDate(person.unavailabilityEnd) : '...'}
                    </span>` : ''}
                    <span>
                    ${person.maxShifts === 0
                ? 'Sem escalas'
                : `Máx: ${person.maxShifts} turnos`}
                </span>
            </div>
        `;
        peopleList.appendChild(card);
    });
    populatePersonSelect();
}

// Render Shifts
function renderShifts() {
    shiftsList.innerHTML = '';
    state.shifts.forEach(shift => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${shift.name}</span>
                <div class="card-actions">
                    <button onclick="editShift('${shift.id}')"><i class="ph ph-pencil"></i></button>
                    <button class="delete-btn" onclick="deleteShift('${shift.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="card-meta">
                <span><i class="ph ph-clock"></i> ${shift.time}</span>
                <span>• Vagas: ${shift.capacity}</span>
            </div>
        `;
        shiftsList.appendChild(card);
    });

    // Update preferred shifts checkboxes in person modal
    const prefContainer = document.getElementById('person-preferred-shifts');
    prefContainer.innerHTML = state.shifts.map(shift => `
        <label class="checkbox-label">
            <input type="checkbox" name="pref-shifts" value="${shift.id}">
            <span>${shift.name}</span>
        </label>
    `).join('');
}

// Person Actions
function openPersonModal(person = null) {
    const modal = document.getElementById('modal-person');
    document.getElementById('modal-person-title').innerText = person ? 'Editar Pessoa' : 'Adicionar Pessoa';
    document.getElementById('person-id').value = person ? person.id : '';
    document.getElementById('person-name').value = person ? person.name : '';
    document.getElementById('person-status').value = person ? person.status : 'disponivel';
    document.getElementById('person-max-shifts').value = person ? person.maxShifts : 5;
    document.getElementById('person-unavailability-start').value = person ? (person.unavailabilityStart || '') : '';
    document.getElementById('person-unavailability-end').value = person ? (person.unavailabilityEnd || '') : '';
    document.getElementById('unavailability-dates').style.display = (person && person.status !== 'disponivel') ? 'block' : 'none';

    const checkboxes = document.querySelectorAll('input[name="pref-shifts"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = person ? person.preferredShifts.includes(checkbox.value) : true;
    });

    modal.classList.add('active');
}

function savePerson(event) {
    event.preventDefault();
    const id = document.getElementById('person-id').value;
    const preferredShifts = Array.from(document.querySelectorAll('input[name="pref-shifts"]:checked')).map(checkbox => checkbox.value);

    const existingPerson = id ? state.people.find(person => person.id === id) : null;
    const personData = {
        id: id || generateId(),
        name: toTitleCase(document.getElementById('person-name').value.trim()),
        status: document.getElementById('person-status').value,
        unavailabilityStart: document.getElementById('person-unavailability-start').value,
        unavailabilityEnd: document.getElementById('person-unavailability-end').value,
        maxShifts: Math.max(0, parseInt(document.getElementById('person-max-shifts').value) || 0),
        preferredShifts,
        password: existingPerson ? (existingPerson.password || '3820') : '3820',
        isAdmin: existingPerson ? (existingPerson.isAdmin || false) : false
    };

    if (id) {
        const index = state.people.findIndex(person => person.id === id);
        state.people[index] = personData;
    } else {
        state.people.push(personData);
    }

    sortPeople();
    saveState();
    renderPeople();
    document.getElementById('modal-person').classList.remove('active');
}

function editPerson(id) {
    const person = state.people.find(person => person.id === id);
    if (person) openPersonModal(person);
}

function toggleAdmin(id) {
    if (!isAdmin()) return;
    const person = state.people.find(p => p.id === id);
    if (!person) return;
    const action = person.isAdmin ? 'remover o acesso de administrador de' : 'tornar administrador';
    if (!confirm(`Deseja ${action} ${getFirstName(person.name)}?`)) return;
    person.isAdmin = !person.isAdmin;
    // Sync currentUser if this is the logged-in person
    if (state.currentUser && state.currentUser.id === id) {
        state.currentUser.isAdmin = person.isAdmin;
        localStorage.setItem('escala_current_user', JSON.stringify(state.currentUser));
    }
    saveState();
    renderPeople();
}

function deletePerson(id) {
    if (confirm('Tem certeza que deseja remover esta pessoa?')) {
        state.people = state.people.filter(person => person.id !== id);
        // Remove from schedule
        for (let shiftId in state.schedule) {
            state.schedule[shiftId] = state.schedule[shiftId].filter(personId => personId !== id);
        }
        saveState();
        renderPeople();
        renderScheduleBoard();
    }
}

// Shift Actions
function openShiftModal(shift = null) {
    const modal = document.getElementById('modal-shift');
    document.getElementById('modal-shift-title').innerText = shift ? 'Editar Turno' : 'Adicionar Turno';
    document.getElementById('shift-id').value = shift ? shift.id : '';
    document.getElementById('shift-name').value = shift ? shift.name : '';
    document.getElementById('shift-time').value = shift ? shift.time : '';
    document.getElementById('shift-capacity').value = shift ? shift.capacity : 2;
    modal.classList.add('active');
}

function saveShift(event) {
    event.preventDefault();
    const id = document.getElementById('shift-id').value;
    const shiftData = {
        id: id || generateId(),
        name: document.getElementById('shift-name').value,
        time: document.getElementById('shift-time').value,
        capacity: parseInt(document.getElementById('shift-capacity').value)
    };

    if (id) {
        const index = state.shifts.findIndex(shift => shift.id === id);
        state.shifts[index] = shiftData;
    } else {
        state.shifts.push(shiftData);
        const days = getWorkingDays();
        days.forEach(day => state.schedule[`${shiftData.id}-${day}`] = []);
    }

    sortShifts();
    saveState();
    renderShifts();
    renderScheduleBoard();
    document.getElementById('modal-shift').classList.remove('active');
}

function editShift(id) {
    const shift = state.shifts.find(shift => shift.id === id);
    if (shift) openShiftModal(shift);
}

function deleteShift(id) {
    if (confirm('Tem certeza que deseja remover este turno?')) {
        state.shifts = state.shifts.filter(shift => shift.id !== id);
        const days = getWorkingDays();
        days.forEach(day => delete state.schedule[`${id}-${day}`]);
        saveState();
        renderShifts();
        renderScheduleBoard();
    }
}

// Schedule Board
function renderScheduleBoard() {
    scheduleBoard.innerHTML = '';

    const sortables = [];
    const days = getWorkingDays();

    const grid = document.createElement('div');
    grid.className = 'schedule-grid';

    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row header-row';
    headerRow.innerHTML = `<div class="grid-cell time-cell">Horários</div>` +
        days.map(day => `<div class="grid-cell day-cell">${formatDate(day)}</div>`).join('');
    grid.appendChild(headerRow);

    state.shifts.forEach((shift, index) => {
        const row = document.createElement('div');
        row.className = `grid-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`;

        let rowHTML = `
            <div class="grid-cell time-cell">
                <span class="shift-name"><i class="ph ph-phone-incoming"></i> ${shift.name}</span>
                <span class="shift-time"><i class="ph ph-clock"></i> ${shift.time}</span>
            </div>
        `;
        row.innerHTML = rowHTML;

        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            if (!state.schedule[dayKey]) state.schedule[dayKey] = [];

            const cell = document.createElement('div');
            cell.className = 'grid-cell dropzone-cell';

            const dropzone = document.createElement('div');
            dropzone.className = 'shift-dropzone';
            dropzone.dataset.shiftId = shift.id;
            dropzone.dataset.day = day;

            dropzone.innerHTML = state.schedule[dayKey].map(personId => {
                const person = state.people.find(person => person.id === personId);
                if (!person) return '';
                return `
                    <div class="scheduled-person" data-person-id="${person.id}">
                        <span class="name">${getFirstName(person.name)}</span>
                        <i class="ph ph-dots-six-vertical text-muted"></i>
                    </div>
                `;
            }).join('');

            cell.appendChild(dropzone);
            row.appendChild(cell);
        });

        grid.appendChild(row);
    });

    scheduleBoard.appendChild(grid);

    document.querySelectorAll('.shift-dropzone').forEach(dropzone => {
        sortables.push(new Sortable(dropzone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function (event) {
                updateScheduleFromDOM();
            }
        }));
    });

    validateSchedule();
}

function updateScheduleFromDOM() {
    const dropzones = document.querySelectorAll('.shift-dropzone');
    dropzones.forEach(dropzone => {
        const shiftId = dropzone.dataset.shiftId;
        const day = dropzone.dataset.day;
        const dayKey = `${shiftId}-${day}`;
        const peopleIds = Array.from(dropzone.children).map(child => child.dataset.personId);
        state.schedule[dayKey] = peopleIds;
    });
    saveState();
    validateSchedule();

    // Refresh personal schedule if a person is selected
    const selectedPersonId = document.getElementById('select-person-schedule').value;
    if (selectedPersonId) {
        renderPersonalSchedule(selectedPersonId);
    }
}

// Validation
function validateSchedule() {
    let hasWarning = false;
    let hasError = false;

    document.querySelectorAll('.scheduled-person').forEach(element => {
        element.classList.remove('conflict-item', 'error-item');
    });

    const personShiftCount = {};
    const days = getWorkingDays();
    const personDays = {};
    const personSameDayErrors = new Set();

    // First pass: identify same-day overlaps
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            const scheduledIds = state.schedule[dayKey] || [];

            scheduledIds.forEach(personId => {
                if (!personDays[personId]) personDays[personId] = [];
                personDays[personId].push(day);

                const occurrences = personDays[personId].filter(date => date === day).length;
                if (occurrences > 1) {
                    personSameDayErrors.add(`${personId}-${day}`);
                }
            });
        });
    });

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            const scheduledIds = state.schedule[dayKey] || [];

            if (scheduledIds.length > shift.capacity || (scheduledIds.length > 0 && scheduledIds.length < shift.capacity)) {
                hasWarning = true;
            }

            scheduledIds.forEach(personId => {
                personShiftCount[personId] = (personShiftCount[personId] || 0) + 1;
                const person = state.people.find(person => person.id === personId);

                if (person) {
                    if (isPersonUnavailable(person, day)) {
                        hasError = true;
                        highlightPerson(shift.id, day, personId, 'error-item');
                    }

                    if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) {
                        hasWarning = true;
                        highlightPerson(shift.id, day, personId, 'conflict-item');
                    }
                }

                if (personSameDayErrors.has(`${personId}-${day}`)) {
                    hasError = true;
                    highlightPerson(shift.id, day, personId, 'error-item');
                }
            });
        });
    });

    for (let personId in personShiftCount) {
        const person = state.people.find(person => person.id === personId);
        if (person && personShiftCount[personId] > person.maxShifts) {
            hasError = true;
            state.shifts.forEach(shift => {
                days.forEach(date => {
                    if ((state.schedule[`${shift.id}-${date}`] || []).includes(personId)) highlightPerson(shift.id, date, personId, 'error-item');
                });
            });
        }
    }

    const statusElement = document.getElementById('validation-status');
    if (hasError) {
        statusElement.innerHTML = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos (2 no mesmo dia / Excesso / Atestado)</span>';
    } else if (hasWarning) {
        statusElement.innerHTML = '<span class="status-badge warning"><i class="ph ph-warning"></i> Distribuição Desbalanceada</span>';
    } else {
        statusElement.innerHTML = '<span class="status-badge success"><i class="ph ph-check-circle"></i> Equilibrado</span>';
    }
}

function highlightPerson(shiftId, day, personId, className) {
    const dropzone = document.querySelector(`.shift-dropzone[data-shift-id="${shiftId}"][data-day="${day}"]`);
    if (dropzone) {
        const element = dropzone.querySelector(`.scheduled-person[data-person-id="${personId}"]`);
        if (element) element.classList.add(className);
    }
}

// AI Generation (Mock logic for local generation, prepared for API)
async function generateSchedule() {
    if (state.people.length === 0 || state.shifts.length === 0) {
        alert("Adicione pessoas e horários primeiro!");
        return;
    }

    document.getElementById('ai-loading').classList.remove('hidden');

    try {
        const provider = state.config.provider || 'openrouter';
        let usedApi = false;

        if (provider === 'openrouter' && state.config.openrouterKey) {
            usedApi = true;
            await callOpenRouterAPI();
        } else if (provider === 'gemini' && state.config.geminiKey) {
            usedApi = true;
            await callGeminiAPI();
        }

        if (!usedApi) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runLocalGenerationAlgorithm();
        }

        saveState();
        renderScheduleBoard();

        const selectedPersonId = document.getElementById('select-person-schedule').value;
        if (selectedPersonId) {
            renderPersonalSchedule(selectedPersonId);
        }
    } catch (e) {
        console.error("Erro ao gerar:", e);
        alert("Ocorreu um erro ao gerar a escala: " + e.message);
    } finally {
        document.getElementById('ai-loading').classList.add('hidden');
    }
}

function buildSchedulePrompt() {
    const days = getWorkingDays();
    const peopleData = state.people.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        unavailabilityStart: p.unavailabilityStart || null,
        unavailabilityEnd: p.unavailabilityEnd || null,
        maxShifts: p.maxShifts,
        preferredShifts: p.preferredShifts
    }));

    const shiftsData = state.shifts.map(s => ({
        id: s.id,
        name: s.name,
        time: s.time,
        capacity: s.capacity
    }));

    return {
        days,
        people: peopleData,
        shifts: shiftsData,
        closedDates: state.closedDates,
        rules: {
            noWeekends: true,
            respectCapacity: true,
            respectMaxShifts: true,
            respectUnavailability: true,
            preferPreferredShifts: true,
            balanceDistribution: true,
            noDuplicatesPerDay: true
        }
    };
}

async function callOpenRouterAPI() {
    const promptData = buildSchedulePrompt();
    const model = state.config.openrouterModel || 'google/gemini-2.0-flash-001';

    const systemPrompt = `Você é um gerador de escala de trabalho. Distribua as pessoas nos turnos respeitando todas as regras abaixo.

Regras:
1. São dias úteis (seg-sex), ignorar finais de semana e feriados
2. Respeitar a capacidade máxima de cada turno
3. Respeitar o máximo de turnos por pessoa (maxShifts)
4. Não escalar pessoa que está em período de indisponibilidade (status !== disponivel OU data dentro do período unavailabilityStart-unavailabilityEnd)
5. Preferir turnos preferenciais de cada pessoa (preferredShifts)
6. Distribuir a carga de forma equilibrada entre as pessoas
7. Uma pessoa NÃO pode estar em dois turnos diferentes no mesmo dia
8. A pessoa pode ficar vaga se não houver candidatos disponíveis

Responda APENAS com JSON válido no formato:
{"assignments":[{"shiftId":"id_do_turno","day":"YYYY-MM-DD","peopleIds":["id_da_pessoa1","id_da_pessoa2"]}]}

NÃO inclua texto, explicação ou markdown além do JSON.`;

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.config.openrouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EscalAI'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Remove markdown code block if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/{[\s\S]*?}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch {
        throw new Error('Resposta da IA não foi um JSON válido: ' + content.substring(0, 200));
    }

    // Clear current schedule
    const days = getWorkingDays();
    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    // Apply assignments
    if (result.assignments && Array.isArray(result.assignments)) {
        result.assignments.forEach(assignment => {
            const key = `${assignment.shiftId}-${assignment.day}`;
            if (!state.schedule[key]) state.schedule[key] = [];
            if (Array.isArray(assignment.peopleIds)) {
                assignment.peopleIds.forEach(personId => {
                    if (state.people.some(p => p.id === personId) && !state.schedule[key].includes(personId)) {
                        state.schedule[key].push(personId);
                    }
                });
            }
        });
    }
}

async function callGeminiAPI() {
    const promptData = buildSchedulePrompt();

    const prompt = `Você é um gerador de escala de trabalho. Distribua as pessoas nos turnos respeitando todas as regras abaixo.

Regras:
1. São dias úteis (seg-sex), ignorar finais de semana e feriados
2. Respeitar a capacidade máxima de cada turno
3. Respeitar o máximo de turnos por pessoa (maxShifts)
4. Não escalar pessoa que está em período de indisponibilidade
5. Preferir turnos preferenciais de cada pessoa (preferredShifts)
6. Distribuir a carga de forma equilibrada entre as pessoas
7. Uma pessoa NÃO pode estar em dois turnos diferentes no mesmo dia
8. A pessoa pode ficar vaga se não houver candidatos disponíveis

Dados:
${JSON.stringify(promptData, null, 2)}

Responda APENAS com JSON válido no formato:
{"assignments":[{"shiftId":"id_do_turno","day":"YYYY-MM-DD","peopleIds":["id_da_pessoa1","id_da_pessoa2"]}]}

NÃO inclua texto, explicação ou markdown além do JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${state.config.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/{[\s\S]*?}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch {
        throw new Error('Resposta da Gemini não foi um JSON válido: ' + text.substring(0, 200));
    }

    const days = getWorkingDays();
    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    if (result.assignments && Array.isArray(result.assignments)) {
        result.assignments.forEach(assignment => {
            const key = `${assignment.shiftId}-${assignment.day}`;
            if (!state.schedule[key]) state.schedule[key] = [];
            if (Array.isArray(assignment.peopleIds)) {
                assignment.peopleIds.forEach(personId => {
                    if (state.people.some(p => p.id === personId) && !state.schedule[key].includes(personId)) {
                        state.schedule[key].push(personId);
                    }
                });
            }
        });
    }
}

function runLocalGenerationAlgorithm() {
    const days = getWorkingDays();

    // Clear current schedule
    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    const shuffle = (array) => array.sort(() => Math.random() - 0.5);
    const counts = {};
    state.people.forEach(person => counts[person.id] = 0);

    days.forEach(day => {
        let availablePeople = state.people.filter(person => !isPersonUnavailable(person, day));
        state.shifts.forEach(shift => {
            let needed = shift.capacity;

            let candidates = availablePeople.filter(person =>
                person.maxShifts > 0 &&
                (person.preferredShifts.length === 0 || person.preferredShifts.includes(shift.id)) &&
                counts[person.id] < person.maxShifts
            );

            const workingToday = [];
            state.shifts.forEach(otherShift => {
                workingToday.push(...(state.schedule[`${otherShift.id}-${day}`] || []));
            });

            candidates = candidates.filter(p => !workingToday.includes(p.id));

            candidates = shuffle(candidates);
            candidates.sort((a, b) => counts[a.id] - counts[b.id]);

            for (let i = 0; i < needed && i < candidates.length; i++) {
                const person = candidates[i];
                state.schedule[`${shift.id}-${day}`].push(person.id);
                counts[person.id]++;
            }
        });
    });
}

// Personal Schedule
function populatePersonSelect() {
    const select = document.getElementById('select-person-schedule');
    const currentValue = select.value || (state.currentUser ? state.currentUser.id : '');

    const sortedPeople = [...state.people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    select.innerHTML = '<option value="">Selecione uma pessoa...</option>' +
        sortedPeople.map(person => `<option value="${person.id}">${getFirstName(person.name)}</option>`).join('');

    if (state.people.some(person => person.id === currentValue)) {
        select.value = currentValue;
    } else {
        // Fallback or empty
    }
}

function renderPersonalSchedule(personId) {
    const container = document.getElementById('personal-table-container');
    if (!personId) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-calendar-blank" style="font-size: 3rem; color: var(--text-muted); opacity: 0.3;"></i>
                <p>Selecione seu nome para ver seus horários</p>
            </div>
        `;
        return;
    }

    const days = getWorkingDays();
    const assignments = [];

    days.forEach(day => {
        state.shifts.forEach(shift => {
            const dayKey = `${shift.id}-${day}`;
            if ((state.schedule[dayKey] || []).includes(personId)) {
                assignments.push({
                    date: day,
                    shiftId: shift.id,
                    shiftName: shift.name,
                    shiftTime: shift.time
                });
            }
        });
    });

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-calendar-x" style="font-size: 3rem; color: var(--text-muted); opacity: 0.3;"></i>
                <p>Você não possui turnos agendados para este período.</p>
            </div>
        `;
        return;
    }

    // Sort assignments by date
    assignments.sort((a, b) => a.date.localeCompare(b.date));

    const person = state.people.find(person => person.id === personId);
    const personName = person ? person.name : '';

    let html = `
        <div class="personal-header-print" style="margin-bottom: 1.5rem;">
            <h2 style="color: var(--primary); font-size: 1.5rem;">Escala Individual: ${getFirstName(personName)}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Período: ${formatDate(days[0])} até ${formatDate(days[days.length - 1])}</p>
        </div>
        <table class="personal-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Escala / Turno</th>
                    <th>Horário</th>
                </tr>
            </thead>
            <tbody>
    `;

    assignments.forEach(assignment => {
        html += `
                <tr>
                    <td><strong>${formatDate(assignment.date)}</strong></td>
                    <td><i class="ph ph-phone-incoming" style="color: var(--secondary); margin-right: 0.5rem;"></i> ${assignment.shiftName}</td>
                    <td><i class="ph ph-clock" style="color: var(--text-muted); margin-right: 0.5rem;"></i> ${assignment.shiftTime}</td>
                    <td style="text-align: right;">
                        <button class="icon-btn" title="Solicitar Troca" onclick="openSwapModal('${assignment.shiftId}', '${assignment.date}')">
                            <i class="ph ph-arrows-left-right"></i>
                        </button>
                    </td>
                </tr>
            `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Auth Handlers
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.toLowerCase().trim();
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    // Append domain if not present
    const email = username.includes('@') ? username : `${username}@crf-pr.org.br`;

    let person = state.people.find(person => generateEmail(person.name) === email && person.password === password);

    // Auto-registration for @crf-pr.org.br with password 3820
    if (!person && email.endsWith('@crf-pr.org.br') && password === '3820') {
        // Check if person already exists with different password, just update it or create new
        let existingPerson = state.people.find(person => generateEmail(person.name) === email);

        if (existingPerson) {
            existingPerson.password = '3820'; // Ensure they can log in if they use the default
            person = existingPerson;
        } else {
            const namePart = email.split('@')[0];
            const rawName = namePart.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

            person = {
                id: generateId(),
                name: toTitleCase(rawName),
                status: 'disponivel',
                maxShifts: 5,
                preferredShifts: state.shifts.map(shift => shift.id),
                password: '3820'
            };
            state.people.push(person);
        }
        saveState();
        renderPeople();
        populatePersonSelect();
    }

    if (person) {
        state.currentUser = person;
        saveState();
        checkAuth();
        errorElement.classList.add('hidden');
        // Try to sync with server
        syncLoginWithServer(email, password);
    } else {
        errorElement.classList.remove('hidden');
    }
}

function handleLogout() {
    state.currentUser = null;
    saveState();
    checkAuth();
    document.getElementById('profile-dropdown').classList.remove('active');
}

function openChangePasswordModal() {
    if (!state.currentUser) return;
    document.getElementById('pw-email').value = generateEmail(state.currentUser.name);
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
    document.getElementById('modal-change-password').classList.add('active');
    document.getElementById('profile-dropdown').classList.remove('active');
}

function handleChangePassword(event) {
    event.preventDefault();
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirmPw = document.getElementById('pw-confirm').value;

    if (current !== state.currentUser.password) {
        alert("Senha atual incorreta.");
        return;
    }

    if (newPw !== confirmPw) {
        alert("A nova senha e a confirmação não coincidem.");
        return;
    }

    if (confirm("Tem certeza que deseja alterar sua senha?")) {
        const personIndex = state.people.findIndex(person => person.id === state.currentUser.id);
        if (personIndex !== -1) {
            state.people[personIndex].password = newPw;
            state.currentUser.password = newPw;
            saveState();
            document.getElementById('modal-change-password').classList.remove('active');
            alert("Senha alterada com sucesso!");
        }
    }
}

// Server Sync Functions
async function syncLoginWithServer(email, password) {
    try {
        const serverUrl = state.config.serverUrl || 'http://localhost:3001';
        // Try to login
        let response = await fetch(`${serverUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.status === 401) {
            // Try to register
            response = await fetch(`${serverUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
        }

        if (response.ok) {
            const data = await response.json();
            state.config.serverToken = data.token;
            state.config.serverUrl = serverUrl;
            saveState();
            // Load config from server
            loadConfigFromServer();
        }
    } catch (err) {
        console.log('Servidor não disponível, usando apenas local.');
    }
}

async function saveConfigToServer() {
    const statusEl = document.getElementById('server-config-status');
    if (!state.config.serverToken) {
        statusEl.innerText = 'Faça login primeiro para salvar no servidor.';
        statusEl.style.color = 'var(--danger)';
        return;
    }

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
                openrouter_model: state.config.openrouterModel || 'google/gemini-2.0-flash-001',
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
            headers: {
                'Authorization': `Bearer ${state.config.serverToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            state.config.openrouterKey = data.openrouter_key || '';
            state.config.openrouterModel = data.openrouter_model || 'google/gemini-2.0-flash-001';
            state.config.geminiKey = data.gemini_key || '';
            state.config.provider = data.provider || 'openrouter';
            saveState();

            // Update UI
            aiOpenrouterKeyInput.value = state.config.openrouterKey;
            aiOpenrouterModelSelect.value = state.config.openrouterModel;
            aiGeminiKeyInput.value = state.config.geminiKey;
            document.querySelector(`input[name="ai-provider"][value="${state.config.provider}"]`).checked = true;
            toggleProviderConfig(state.config.provider);

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

// Swap & Notification Logic
function openSwapModal(myShiftId, date) {
    if (!state.currentUser) return;
    const shift = state.shifts.find(shift => shift.id === myShiftId);
    if (!shift) return;

    document.getElementById('swap-my-shift-id').value = myShiftId;
    document.getElementById('swap-my-date').value = date;
    document.getElementById('swap-my-details').innerText = `${shift.name} (${shift.time}) em ${formatDate(date)}`;

    // Populate colleagues
    const targetPersonSelect = document.getElementById('swap-target-person');
    targetPersonSelect.innerHTML = '<option value="">Selecione um colega...</option>' +
        state.people
            .filter(person => person.id !== state.currentUser.id)
            .map(person => `<option value="${person.id}">${person.name}</option>`)
            .join('');

    document.getElementById('swap-target-shift').innerHTML = '<option value="">Selecione o turno do colega...</option>';
    document.getElementById('swap-target-shift').disabled = true;

    document.getElementById('modal-swap').classList.add('active');
}

function updateSwapTargetShifts(colleagueId) {
    const targetShiftSelect = document.getElementById('swap-target-shift');
    if (!colleagueId) {
        targetShiftSelect.innerHTML = '<option value="">Selecione o turno do colega...</option>';
        targetShiftSelect.disabled = true;
        return;
    }

    const workingDays = getWorkingDays();
    const colleagueAssignments = [];

    workingDays.forEach(day => {
        state.shifts.forEach(shift => {
            const dayKey = `${shift.id}-${day}`;
            if ((state.schedule[dayKey] || []).includes(colleagueId)) {
                colleagueAssignments.push({
                    shiftId: shift.id,
                    date: day,
                    label: `${shift.name} em ${formatDate(day)}`
                });
            }
        });
    });

    if (colleagueAssignments.length === 0) {
        targetShiftSelect.innerHTML = '<option value="">Este colega não tem turnos nesta semana.</option>';
        targetShiftSelect.disabled = true;
    } else {
        targetShiftSelect.innerHTML = '<option value="">Selecione o turno para trocar...</option>' +
            colleagueAssignments.map(assignment => `<option value="${assignment.shiftId}|${assignment.date}">${assignment.label}</option>`).join('');
        targetShiftSelect.disabled = false;
    }
}

function handleSwapRequest(event) {
    event.preventDefault();
    const myShiftId = document.getElementById('swap-my-shift-id').value;
    const myDate = document.getElementById('swap-my-date').value;
    const colleagueId = document.getElementById('swap-target-person').value;
    const [targetShiftId, targetDate] = document.getElementById('swap-target-shift').value.split('|');

    if (!colleagueId || !targetShiftId) {
        alert("Por favor, selecione um colega e um turno.");
        return;
    }

    const notification = {
        id: generateId(),
        fromId: state.currentUser.id,
        fromName: state.currentUser.name,
        toId: colleagueId,
        myShiftId,
        myDate,
        targetShiftId,
        targetDate,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    state.notifications.push(notification);
    saveState();
    alert("Solicitação de troca enviada!");
    document.getElementById('modal-swap').classList.remove('active');
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!state.currentUser) return;

    const pendingCount = state.notifications.filter(notification => notification.toId === state.currentUser.id && notification.status === 'pending').length;

    if (pendingCount > 0) {
        badge.innerText = pendingCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!state.currentUser) return;

    const myNotifications = state.notifications
        .filter(notification => notification.toId === state.currentUser.id)
        .sort((notificationA, notificationB) => new Date(notificationB.timestamp) - new Date(notificationA.timestamp));

    if (myNotifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Não há novas notificações.</p></div>';
        return;
    }

    container.innerHTML = myNotifications.map(notification => {
        const myShift = state.shifts.find(shift => shift.id === notification.targetShiftId);
        const theirShift = state.shifts.find(shift => shift.id === notification.myShiftId);

        return `
            <div class="notification-item">
                <div class="notification-content">
                    <p><strong>${getFirstName(notification.fromName)}</strong> deseja trocar o turno dele de <strong>${theirShift.name} em ${formatDate(notification.myDate)}</strong> pelo seu turno de <strong>${myShift.name} em ${formatDate(notification.targetDate)}</strong>.</p>
                </div>
                ${notification.status === 'pending' ? `
                    <div class="notification-actions">
                        <button class="primary-btn" onclick="acceptSwap('${notification.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Aceitar</button>
                        <button class="secondary-btn" onclick="rejectSwap('${notification.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Recusar</button>
                    </div>
                ` : `<span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.7rem;">${notification.status === 'accepted' ? 'Aceito' : 'Recusado'}</span>`}
            </div>
        `;
    }).join('');
}

function acceptSwap(notificationId) {
    const notification = state.notifications.find(notif => notif.id === notificationId);
    if (!notification) return;

    // Perform the swap in state.schedule
    const myKey = `${notification.targetShiftId}-${notification.targetDate}`;
    const theirKey = `${notification.myShiftId}-${notification.myDate}`;

    // Remove me from my shift and add them
    state.schedule[myKey] = (state.schedule[myKey] || []).filter(id => id !== state.currentUser.id);
    state.schedule[myKey].push(notification.fromId);

    // Remove them from their shift and add me
    state.schedule[theirKey] = (state.schedule[theirKey] || []).filter(id => id !== notification.fromId);
    state.schedule[theirKey].push(state.currentUser.id);

    notification.status = 'accepted';
    saveState();
    renderNotifications();
    updateNotificationBadge();
    renderPersonalSchedule(state.currentUser.id);
    renderScheduleBoard();
    alert("Troca realizada com sucesso!");
}

function rejectSwap(notificationId) {
    const notification = state.notifications.find(notif => notif.id === notificationId);
    if (!notification) return;
    notification.status = 'rejected';
    saveState();
    renderNotifications();
    updateNotificationBadge();
}

// Boot
document.addEventListener('DOMContentLoaded', init);


function exportSchedulePDF() {

    const days = getWorkingDays();

    let html = `
        <div id="pdf-export" style="
            font-family: Arial, sans-serif;
            padding: 8px;
            color: #111;
            background: white;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:10px;
                border-bottom:2px solid #7c3aed;
                padding-bottom:6px;
            ">
                <div>
                    <h1 style="
                        margin:0;
                        color:#7c3aed;
                        font-size:22px;
                    ">
                        Escala de Trabalho
                    </h1>

                    <p style="
                        margin:4px 0 0;
                        font-size:11px;
                        color:#666;
                    ">
                        ${formatDate(days[0])} até ${formatDate(days[days.length - 1])}
                    </p>
                </div>

                <div style="
                    text-align:right;
                    color:#666;
                    font-size:10px;
                ">
                    <div><strong>EscalAI</strong></div>
                    <div>${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
            </div>

            <table style="
                width:100%;
                border-collapse:collapse;
                table-layout:fixed;
            ">
                <thead>
                    <tr>

                        <th style="
                            background:#7c3aed;
                            color:white;
                            padding:6px;
                            border:1px solid #ddd;
                            width:120px;
                            font-size:11px;
                        ">
                            Turno
                        </th>

                        ${days.map(day => `
                            <th style="
                                background:#7c3aed;
                                color:white;
                                padding:6px;
                                border:1px solid #ddd;
                                font-size:10px;
                            ">
                                ${formatDate(day)}
                            </th>
                        `).join('')}

                    </tr>
                </thead>

                <tbody>
    `;

    state.shifts.forEach((shift, index) => {

        html += `
            <tr style="
                background:${index % 2 === 0 ? '#fafafa' : '#ffffff'};
            ">

                <td style="
                    border:1px solid #ddd;
                    padding:8px;
                    vertical-align:top;
                ">
                    <div style="
                        font-size:11px;
                        font-weight:bold;
                        margin-bottom:4px;
                        color:#111;
                    ">
                        ${shift.name}
                    </div>

                    <div style="
                        font-size:10px;
                        color:#666;
                    ">
                        ${shift.time}
                    </div>
                </td>
        `;

        days.forEach(day => {

            const key = `${shift.id}-${day}`;

            const peopleIds = (() => {

                if (state.schedule[key]?.length) {
                    return state.schedule[key];
                }

                const dropzone = document.querySelector(
                    `.shift-dropzone[data-shift-id="${shift.id}"][data-day="${day}"]`
                );

                if (!dropzone) return [];

                return Array.from(
                    dropzone.querySelectorAll('.scheduled-person')
                ).map(el => el.dataset.personId);

            })();

            html += `
                <td style="
                    border:1px solid #ddd;
                    padding:4px;
                    vertical-align:top;
                    height:70px;
                ">
            `;

            if (peopleIds.length === 0) {

                html += `
                    <div style="
                        color:#bbb;
                        text-align:center;
                        padding-top:10px;
                        font-size:10px;
                    ">
                        —
                    </div>
                `;

            } else {

                peopleIds.forEach(personId => {

                    const person = state.people.find(p => p.id === personId);

                    if (!person) return;

                    html += `
                        <div style="
                            background:#ede9fe;
                            border:1px solid #c4b5fd;
                            border-radius:6px;
                            padding:5px;
                            margin-bottom:4px;
                            text-align:center;
                            font-size:11px;
                            font-weight:600;
                            color:#4c1d95;
                            line-height:1.2;
                        ">
                            ${getFirstName(person.name)}
                        </div>
                    `;
                });
            }

            html += `</td>`;
        });

        html += `</tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    const container = document.createElement('div');

    container.innerHTML = html;

    document.body.appendChild(container);

    const previewWindow = window.open('', '_blank');

    previewWindow.document.write(`
        <html>
        <head>
            <title>Pré-visualização da Escala</title>

            <style>

                body{
                    margin:0;
                    padding:12px;
                    background:#e5e7eb;
                    font-family:Arial,sans-serif;
                }

                .toolbar{
                    position:sticky;
                    top:0;
                    z-index:999;
                    background:white;
                    padding:10px;
                    margin-bottom:12px;
                    border-radius:10px;
                    box-shadow:0 4px 12px rgba(0,0,0,.08);
                    display:flex;
                    gap:10px;
                    align-items:center;
                }

                button{
                    border:none;
                    padding:10px 14px;
                    border-radius:8px;
                    cursor:pointer;
                    font-size:12px;
                    font-weight:600;
                }

                .download{
                    background:#7c3aed;
                    color:white;
                }

                .close{
                    background:#ef4444;
                    color:white;
                }

                #preview-container{
                    background:white;
                    padding:10px;
                    border-radius:12px;
                    box-shadow:0 6px 18px rgba(0,0,0,.10);
                    overflow:auto;
                }

            </style>
        </head>

        <body>

            <div class="toolbar">

                <button class="download" id="btn-download">
                    Baixar PDF
                </button>

                <button class="close" onclick="window.close()">
                    Fechar
                </button>

            </div>

            <div id="preview-container">
                ${html}
            </div>

        </body>
        </html>
    `);

    previewWindow.document.close();

    previewWindow.onload = () => {

        previewWindow.document
            .getElementById('btn-download')
            .addEventListener('click', () => {

                const pdfElement =
                    previewWindow.document.querySelector('#pdf-export');

                html2pdf()
                    .set({

                        margin: 0.1,

                        filename: `escala-${state.scheduleStartDate}.pdf`,

                        image: {
                            type: 'jpeg',
                            quality: 1
                        },

                        html2canvas: {
                            scale: 2,
                            useCORS: true
                        },

                        jsPDF: {
                            unit: 'in',
                            format: 'a4',
                            orientation: 'landscape'
                        },

                        pagebreak: {
                            mode: ['avoid-all', 'css', 'legacy']
                        }

                    })
                    .from(pdfElement)
                    .save();

            });
    };

    document.body.removeChild(container);
}

// Exports for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { toTitleCase, generateEmail, calculateDefaultEndDate, getFirstName };
}