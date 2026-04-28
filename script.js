// State Management
let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { apiKey: '' }
};

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
    renderPeople();
    renderShifts();
    renderScheduleBoard();
    setupEventListeners();
    aiApiKeyInput.value = state.config.apiKey;
    validateSchedule();
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
        state.schedule[shiftData.id] = []; // initialize schedule slot
    }

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
        delete state.schedule[id];
        saveState();
        renderShifts();
        renderScheduleBoard();
    }
}

// Schedule Board
function renderScheduleBoard() {
    scheduleBoard.innerHTML = '';
    
    // Sortable Instances Array
    const sortables = [];

    state.shifts.forEach(shift => {
        // Ensure schedule slot exists
        if (!state.schedule[shift.id]) state.schedule[shift.id] = [];

        const column = document.createElement('div');
        column.className = 'shift-column';
        column.innerHTML = `
            <div class="shift-column-header">
                <span class="shift-column-title">${shift.name}</span>
                <span class="shift-column-meta">${shift.time} • ${state.schedule[shift.id].length}/${shift.capacity} vagas</span>
            </div>
            <div class="shift-dropzone" data-shift-id="${shift.id}">
                ${state.schedule[shift.id].map(personId => {
                    const person = state.people.find(p => p.id === personId);
                    if (!person) return '';
                    return `
                        <div class="scheduled-person" data-person-id="${person.id}">
                            <span class="name">${person.name}</span>
                            <i class="ph ph-dots-six-vertical text-muted"></i>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        scheduleBoard.appendChild(column);

        // Initialize Sortable
        const dropzone = column.querySelector('.shift-dropzone');
        sortables.push(new Sortable(dropzone, {
            group: 'shared', // set both lists to same group
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
        const peopleIds = Array.from(dz.children).map(child => child.dataset.personId);
        state.schedule[shiftId] = peopleIds;
    });
    saveState();
    validateSchedule();
    
    // Re-render to update counts
    renderScheduleBoard();
}

// Validation
function validateSchedule() {
    let hasWarning = false;
    let hasError = false;
    let messages = [];

    // Reset warnings
    document.querySelectorAll('.scheduled-person').forEach(el => {
        el.classList.remove('conflict-item', 'error-item');
    });

    // Track shift counts per person
    const personShiftCount = {};
    
    state.shifts.forEach(shift => {
        const scheduledIds = state.schedule[shift.id] || [];
        
        // Capacity check
        if (scheduledIds.length > shift.capacity) {
            hasWarning = true;
        } else if (scheduledIds.length < shift.capacity) {
            hasWarning = true;
        }

        scheduledIds.forEach(pId => {
            personShiftCount[pId] = (personShiftCount[pId] || 0) + 1;
            const person = state.people.find(p => p.id === pId);
            
            if (person) {
                // Rule: status check
                if (person.status !== 'disponivel') {
                    hasError = true;
                    highlightPerson(shift.id, pId, 'error-item');
                }
                
                // Rule: preferred shift check
                if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) {
                    hasWarning = true;
                    highlightPerson(shift.id, pId, 'conflict-item');
                }
            }
        });
    });

    // Rule: max shifts check
    for (let pId in personShiftCount) {
        const person = state.people.find(p => p.id === pId);
        if (person && personShiftCount[pId] > person.maxShifts) {
            hasError = true;
            // highlight all occurrences
            state.shifts.forEach(s => {
                if(state.schedule[s.id].includes(pId)) highlightPerson(s.id, pId, 'error-item');
            });
        }
    }

    const statusEl = document.getElementById('validation-status');
    if (hasError) {
        statusEl.innerHTML = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos Graves (Atestado/Férias/Excesso)</span>';
    } else if (hasWarning) {
        statusEl.innerHTML = '<span class="status-badge warning"><i class="ph ph-warning"></i> Distribuição Desbalanceada</span>';
    } else {
        statusEl.innerHTML = '<span class="status-badge success"><i class="ph ph-check-circle"></i> Equilibrado</span>';
    }
}

function highlightPerson(shiftId, personId, className) {
    const dz = document.querySelector(`.shift-dropzone[data-shift-id="${shiftId}"]`);
    if(dz) {
        const el = dz.querySelector(`.scheduled-person[data-person-id="${personId}"]`);
        if(el) el.classList.add(className);
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
    // Clear current schedule
    state.shifts.forEach(s => state.schedule[s.id] = []);
    
    // Get available people
    let availablePeople = state.people.filter(p => p.status === 'disponivel');
    
    // Shuffle helper
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    // Track assigned counts
    const counts = {};
    availablePeople.forEach(p => counts[p.id] = 0);

    // Simple greedy assignment
    state.shifts.forEach(shift => {
        let needed = shift.capacity;
        
        // 1. Try to find people who prefer this shift
        let candidates = availablePeople.filter(p => 
            (p.preferredShifts.length === 0 || p.preferredShifts.includes(shift.id)) &&
            counts[p.id] < p.maxShifts
        );
        
        candidates = shuffle(candidates);
        
        // Sort candidates by those who have fewer shifts
        candidates.sort((a, b) => counts[a.id] - counts[b.id]);

        for (let i = 0; i < needed && i < candidates.length; i++) {
            const p = candidates[i];
            state.schedule[shift.id].push(p.id);
            counts[p.id]++;
        }
    });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
