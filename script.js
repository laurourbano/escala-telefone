// State Management
let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { apiKey: '' },
    scheduleStartDate: localStorage.getItem('escala_start_date') || '',
    scheduleEndDate: localStorage.getItem('escala_end_date') || '',
    closedDates: JSON.parse(localStorage.getItem('escala_closed_dates')) || [],
    currentUser: JSON.parse(localStorage.getItem('escala_current_user')) || null
};

// Ensure all people have a password (default 3820)
state.people.forEach(p => {
    if (!p.password) p.password = '3820';
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
const menuBtns = document.querySelectorAll('.menu-btn');
const peopleList = document.getElementById('people-list');
const shiftsList = document.getElementById('shifts-list');
const scheduleBoard = document.getElementById('schedule-board');
const aiApiKeyInput = document.getElementById('ai-api-key');

const scheduleStartDateInput = document.getElementById('schedule-start-date');
const scheduleEndDateInput = document.getElementById('schedule-end-date');
const inputClosedDate = document.getElementById('input-closed-date');
const btnAddClosedDate = document.getElementById('btn-add-closed-date');
const btnFetchHolidays = document.getElementById('btn-fetch-holidays');
const closedDatesList = document.getElementById('closed-dates-list');

// Initialize
function init() {
    sortShifts(); // Guarantee shifts are sorted initially
    renderPeople();
    renderShifts();
    
    scheduleStartDateInput.value = state.scheduleStartDate;
    scheduleEndDateInput.value = state.scheduleEndDate;
    renderClosedDates();

    renderScheduleBoard();
    setupEventListeners();
    aiApiKeyInput.value = state.config.apiKey;
    validateSchedule();
    populatePersonSelect();
    checkAuth();
}

function checkAuth() {
    if (state.currentUser) {
        document.getElementById('login-overlay').classList.remove('active');
        document.getElementById('topbar-user-actions').style.display = 'flex';
        document.getElementById('display-user-name').innerText = state.currentUser.name;
    } else {
        document.getElementById('login-overlay').classList.add('active');
        document.getElementById('topbar-user-actions').style.display = 'none';
    }
}

// Sort shifts by start time and name
function sortShifts() {
    state.shifts.sort((a, b) => {
        const timeA = (a.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        const timeB = (b.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        if (timeA === timeB) {
            return a.name.localeCompare(b.name);
        }
        return timeA.localeCompare(timeB);
    });
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
    const parts = name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim()
        .split(/\s+/);
    
    if (parts.length > 1) {
        return `${parts[0]}.${parts[parts.length - 1]}@crf-pr.org.br`;
    }
    return `${parts[0]}@crf-pr.org.br`;
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
    state.closedDates = state.closedDates.filter(d => d !== date);
    saveState();
    renderClosedDates();
    renderScheduleBoard();
}

// Navigation
function switchTab(tabId) {
    menuBtns.forEach(btn => btn.classList.remove('active'));
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
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Modals
    document.getElementById('btn-add-person').addEventListener('click', () => openPersonModal());
    document.getElementById('btn-add-shift').addEventListener('click', () => openShiftModal());
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('active'));
    });

    // Forms
    document.getElementById('form-person').addEventListener('submit', savePerson);
    document.getElementById('form-shift').addEventListener('submit', saveShift);

    // Config
    aiApiKeyInput.addEventListener('change', (e) => {
        state.config.apiKey = e.target.value;
        saveState();
    });

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
            const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            const holidays = await res.json();
            let added = 0;
            holidays.forEach(h => {
                if (!state.closedDates.includes(h.date)) {
                    state.closedDates.push(h.date);
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
        } catch(e) {
            alert("Erro ao buscar feriados da BrasilAPI.");
        }
    });

    // Actions
    document.getElementById('btn-generate').addEventListener('click', generateSchedule);
    document.getElementById('btn-export').addEventListener('click', () => {
        window.print();
    });

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
    
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');
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

// Render People
function renderPeople() {
    peopleList.innerHTML = '';
    state.people.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${person.name}</span>
                <div class="card-actions">
                    <button onclick="editPerson('${person.id}')"><i class="ph ph-pencil"></i></button>
                    <button class="delete-btn" onclick="deletePerson('${person.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="card-meta" style="flex-wrap: wrap;">
                <span class="badge ${person.status}">${person.status}</span>
                ${person.status !== 'disponivel' && (person.unavailabilityStart || person.unavailabilityEnd) ? 
                    `<span class="badge" style="background: var(--bg-card); border: 1px solid var(--border);">
                        ${person.unavailabilityStart ? formatDate(person.unavailabilityStart) : '...'} - 
                        ${person.unavailabilityEnd ? formatDate(person.unavailabilityEnd) : '...'}
                    </span>` : ''}
                <span>Máx: ${person.maxShifts} turnos</span>
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
    checkboxes.forEach(cb => {
        cb.checked = person ? person.preferredShifts.includes(cb.value) : true;
    });

    modal.classList.add('active');
}

function savePerson(e) {
    e.preventDefault();
    const id = document.getElementById('person-id').value;
    const preferredShifts = Array.from(document.querySelectorAll('input[name="pref-shifts"]:checked')).map(cb => cb.value);

    const personData = {
        id: id || generateId(),
        name: document.getElementById('person-name').value,
        status: document.getElementById('person-status').value,
        unavailabilityStart: document.getElementById('person-unavailability-start').value,
        unavailabilityEnd: document.getElementById('person-unavailability-end').value,
        maxShifts: parseInt(document.getElementById('person-max-shifts').value),
        preferredShifts,
        password: id ? (state.people.find(p => p.id === id).password || '3820') : '3820'
    };

    if (id) {
        const index = state.people.findIndex(p => p.id === id);
        state.people[index] = personData;
    } else {
        state.people.push(personData);
    }

    saveState();
    renderPeople();
    document.getElementById('modal-person').classList.remove('active');
}

function editPerson(id) {
    const person = state.people.find(p => p.id === id);
    if (person) openPersonModal(person);
}

function deletePerson(id) {
    if (confirm('Tem certeza que deseja remover esta pessoa?')) {
        state.people = state.people.filter(p => p.id !== id);
        // Remove from schedule
        for (let shiftId in state.schedule) {
            state.schedule[shiftId] = state.schedule[shiftId].filter(pId => pId !== id);
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

function saveShift(e) {
    e.preventDefault();
    const id = document.getElementById('shift-id').value;
    const shiftData = {
        id: id || generateId(),
        name: document.getElementById('shift-name').value,
        time: document.getElementById('shift-time').value,
        capacity: parseInt(document.getElementById('shift-capacity').value)
    };

    if (id) {
        const index = state.shifts.findIndex(s => s.id === id);
        state.shifts[index] = shiftData;
    } else {
        state.shifts.push(shiftData);
        const days = getWorkingDays();
        days.forEach(d => state.schedule[`${shiftData.id}-${d}`] = []);
    }

    sortShifts();
    saveState();
    renderShifts();
    renderScheduleBoard();
    document.getElementById('modal-shift').classList.remove('active');
}

function editShift(id) {
    const shift = state.shifts.find(s => s.id === id);
    if (shift) openShiftModal(shift);
}

function deleteShift(id) {
    if (confirm('Tem certeza que deseja remover este turno?')) {
        state.shifts = state.shifts.filter(s => s.id !== id);
        const days = getWorkingDays();
        days.forEach(d => delete state.schedule[`${id}-${d}`]);
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
        days.map(d => `<div class="grid-cell day-cell">${formatDate(d)}</div>`).join('');
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
                const person = state.people.find(p => p.id === personId);
                if (!person) return '';
                return `
                    <div class="scheduled-person" data-person-id="${person.id}">
                        <span class="name">${person.name}</span>
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
            onEnd: function (evt) {
                updateScheduleFromDOM();
            }
        }));
    });

    validateSchedule();
}

function updateScheduleFromDOM() {
    const dropzones = document.querySelectorAll('.shift-dropzone');
    dropzones.forEach(dz => {
        const shiftId = dz.dataset.shiftId;
        const day = dz.dataset.day;
        const dayKey = `${shiftId}-${day}`;
        const peopleIds = Array.from(dz.children).map(child => child.dataset.personId);
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

    document.querySelectorAll('.scheduled-person').forEach(el => {
        el.classList.remove('conflict-item', 'error-item');
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

            scheduledIds.forEach(pId => {
                if (!personDays[pId]) personDays[pId] = [];
                personDays[pId].push(day);

                const occurrences = personDays[pId].filter(d => d === day).length;
                if (occurrences > 1) {
                    personSameDayErrors.add(`${pId}-${day}`);
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

            scheduledIds.forEach(pId => {
                personShiftCount[pId] = (personShiftCount[pId] || 0) + 1;
                const person = state.people.find(p => p.id === pId);

                if (person) {
                    if (isPersonUnavailable(person, day)) {
                        hasError = true;
                        highlightPerson(shift.id, day, pId, 'error-item');
                    }

                    if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) {
                        hasWarning = true;
                        highlightPerson(shift.id, day, pId, 'conflict-item');
                    }
                }

                if (personSameDayErrors.has(`${pId}-${day}`)) {
                    hasError = true;
                    highlightPerson(shift.id, day, pId, 'error-item');
                }
            });
        });
    });

    for (let pId in personShiftCount) {
        const person = state.people.find(p => p.id === pId);
        if (person && personShiftCount[pId] > person.maxShifts) {
            hasError = true;
            state.shifts.forEach(s => {
                days.forEach(d => {
                    if ((state.schedule[`${s.id}-${d}`] || []).includes(pId)) highlightPerson(s.id, d, pId, 'error-item');
                });
            });
        }
    }

    const statusEl = document.getElementById('validation-status');
    if (hasError) {
        statusEl.innerHTML = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos (2 no mesmo dia / Excesso / Atestado)</span>';
    } else if (hasWarning) {
        statusEl.innerHTML = '<span class="status-badge warning"><i class="ph ph-warning"></i> Distribuição Desbalanceada</span>';
    } else {
        statusEl.innerHTML = '<span class="status-badge success"><i class="ph ph-check-circle"></i> Equilibrado</span>';
    }
}

function highlightPerson(shiftId, day, personId, className) {
    const dz = document.querySelector(`.shift-dropzone[data-shift-id="${shiftId}"][data-day="${day}"]`);
    if (dz) {
        const el = dz.querySelector(`.scheduled-person[data-person-id="${personId}"]`);
        if (el) el.classList.add(className);
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
        if (state.config.apiKey) {
            // Placeholder para chamada da API do Gemini
            // await callGeminiAPI();
            console.log("Usaria a API do Gemini com a chave:", state.config.apiKey);
            await new Promise(r => setTimeout(r, 1500)); // Simula delay
            runLocalGenerationAlgorithm();
        } else {
            // Local fallback algorithm
            await new Promise(r => setTimeout(r, 1000)); // Simulate delay for effect
            runLocalGenerationAlgorithm();
        }

        saveState();
        renderScheduleBoard();

        // Refresh personal schedule if a person is selected
        const selectedPersonId = document.getElementById('select-person-schedule').value;
        if (selectedPersonId) {
            renderPersonalSchedule(selectedPersonId);
        }
    } catch (e) {
        console.error("Erro ao gerar:", e);
        alert("Ocorreu um erro ao gerar a escala.");
    } finally {
        document.getElementById('ai-loading').classList.add('hidden');
    }
}

function runLocalGenerationAlgorithm() {
    const days = getWorkingDays();

    // Clear current schedule
    state.shifts.forEach(s => {
        days.forEach(d => {
            state.schedule[`${s.id}-${d}`] = [];
        });
    });

    const shuffle = (array) => array.sort(() => Math.random() - 0.5);
    const counts = {};
    state.people.forEach(p => counts[p.id] = 0);

    days.forEach(day => {
        let availablePeople = state.people.filter(p => !isPersonUnavailable(p, day));
        state.shifts.forEach(shift => {
            let needed = shift.capacity;

            let candidates = availablePeople.filter(p =>
                (p.preferredShifts.length === 0 || p.preferredShifts.includes(shift.id)) &&
                counts[p.id] < p.maxShifts
            );

            const workingToday = [];
            state.shifts.forEach(s => {
                workingToday.push(...(state.schedule[`${s.id}-${day}`] || []));
            });

            candidates = candidates.filter(p => !workingToday.includes(p.id));

            candidates = shuffle(candidates);
            candidates.sort((a, b) => counts[a.id] - counts[b.id]);

            for (let i = 0; i < needed && i < candidates.length; i++) {
                const p = candidates[i];
                state.schedule[`${shift.id}-${day}`].push(p.id);
                counts[p.id]++;
            }
        });
    });
}

// Personal Schedule
function populatePersonSelect() {
    const select = document.getElementById('select-person-schedule');
    const currentValue = select.value || (state.currentUser ? state.currentUser.id : '');
    
    select.innerHTML = '<option value="">Selecione uma pessoa...</option>' + 
        state.people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    if (state.people.some(p => p.id === currentValue)) {
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

    const person = state.people.find(p => p.id === personId);
    const personName = person ? person.name : '';

    let html = `
        <div class="personal-header-print" style="margin-bottom: 1.5rem;">
            <h2 style="color: var(--primary); font-size: 1.5rem;">Escala Individual: ${personName}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Período: ${formatDate(days[0])} até ${formatDate(days[days.length-1])}</p>
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

    assignments.forEach(as => {
        html += `
            <tr>
                <td><strong>${formatDate(as.date)}</strong></td>
                <td><i class="ph ph-phone-incoming" style="color: var(--secondary); margin-right: 0.5rem;"></i> ${as.shiftName}</td>
                <td><i class="ph ph-clock" style="color: var(--text-muted); margin-right: 0.5rem;"></i> ${as.shiftTime}</td>
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
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.toLowerCase().trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    // Append domain if not present
    const email = username.includes('@') ? username : `${username}@crf-pr.org.br`;

    let person = state.people.find(p => generateEmail(p.name) === email && p.password === password);

    // Fallback for initial setup: ONLY works if the system is completely empty
    if (!person && state.people.length === 0 && email === 'lauro.urbano@crf-pr.org.br' && password === '3820') {
        // Look if Lauro Urbano exists with any password or ID, otherwise create it
        let existingLauro = state.people.find(p => generateEmail(p.name) === 'lauro.urbano@crf-pr.org.br');
        
        if (!existingLauro) {
            existingLauro = {
                id: generateId(),
                name: 'Lauro Urbano',
                status: 'disponivel',
                maxShifts: 5,
                preferredShifts: [],
                password: '3820'
            };
            state.people.push(existingLauro);
            saveState();
            renderPeople();
        }
        person = existingLauro;
        // Only set to 3820 if the person doesn't have a password yet
        if (!person.password) person.password = '3820';
    }

    if (person) {
        state.currentUser = person;
        saveState();
        checkAuth();
        errorEl.classList.add('hidden');
    } else {
        errorEl.classList.remove('hidden');
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

function handleChangePassword(e) {
    e.preventDefault();
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
        const personIndex = state.people.findIndex(p => p.id === state.currentUser.id);
        if (personIndex !== -1) {
            state.people[personIndex].password = newPw;
            state.currentUser.password = newPw;
            saveState();
            document.getElementById('modal-change-password').classList.remove('active');
            alert("Senha alterada com sucesso! Na próxima vez, use sua nova senha.");
        }
    }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
