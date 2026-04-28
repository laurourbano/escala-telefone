// State Management
let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { apiKey: '' }
};

// Migration check for old schedule format
if (Object.keys(state.schedule).length > 0) {
    const firstKey = Object.keys(state.schedule)[0];
    if (!firstKey.includes('-Segunda') && !firstKey.includes('-Terça') && !firstKey.includes('-Quarta') && !firstKey.includes('-Quinta') && !firstKey.includes('-Sexta')) {
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

// Initialize
function init() {
    sortShifts(); // Guarantee shifts are sorted initially
    renderPeople();
    renderShifts();
    renderScheduleBoard();
    setupEventListeners();
    aiApiKeyInput.value = state.config.apiKey;
    validateSchedule();
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
}

// Navigation
function switchTab(tabId) {
    menuBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    panels.forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`panel-${tabId}`).classList.remove('hidden');
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

    // AI Key
    aiApiKeyInput.addEventListener('change', (e) => {
        state.config.apiKey = e.target.value;
        saveState();
    });

    // Actions
    document.getElementById('btn-generate').addEventListener('click', generateSchedule);
    document.getElementById('btn-export').addEventListener('click', () => {
        window.print();
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
            <div class="card-meta">
                <span class="badge ${person.status}">${person.status}</span>
                <span>Máx: ${person.maxShifts} turnos</span>
            </div>
        `;
        peopleList.appendChild(card);
    });
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
        maxShifts: parseInt(document.getElementById('person-max-shifts').value),
        preferredShifts
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
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
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
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
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
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

    const grid = document.createElement('div');
    grid.className = 'schedule-grid';

    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row header-row';
    headerRow.innerHTML = `<div class="grid-cell time-cell">Horários</div>` +
        days.map(d => `<div class="grid-cell day-cell">${d}</div>`).join('');
    grid.appendChild(headerRow);

    state.shifts.forEach((shift, index) => {
        const row = document.createElement('div');
        row.className = `grid-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`;

        let rowHTML = `
            <div class="grid-cell time-cell">
                <div class="shift-time">${shift.time}</div>
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
}

// Validation
function validateSchedule() {
    let hasWarning = false;
    let hasError = false;

    document.querySelectorAll('.scheduled-person').forEach(el => {
        el.classList.remove('conflict-item', 'error-item');
    });

    const personShiftCount = {};
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
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
                    if (person.status !== 'disponivel') {
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
    } catch (e) {
        console.error("Erro ao gerar:", e);
        alert("Ocorreu um erro ao gerar a escala.");
    } finally {
        document.getElementById('ai-loading').classList.add('hidden');
    }
}

function runLocalGenerationAlgorithm() {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

    // Clear current schedule
    state.shifts.forEach(s => {
        days.forEach(d => {
            state.schedule[`${s.id}-${d}`] = [];
        });
    });

    let availablePeople = state.people.filter(p => p.status === 'disponivel');
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);
    const counts = {};
    availablePeople.forEach(p => counts[p.id] = 0);

    days.forEach(day => {
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

// Boot
document.addEventListener('DOMContentLoaded', init);
