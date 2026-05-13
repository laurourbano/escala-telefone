function sortShifts() {
    state.shifts.sort((shiftA, shiftB) => {
        const timeA = (shiftA.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        const timeB = (shiftB.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return shiftA.name.localeCompare(shiftB.name);
    });
}

function openShiftModal(shift = null) {
    document.getElementById('modal-shift-title').innerText = shift ? 'Editar Horário' : 'Novo Horário';
    document.getElementById('shift-id').value = shift ? shift.id : '';
    document.getElementById('shift-name').value = shift ? shift.name : '';
    document.getElementById('shift-time').value = shift ? shift.time : '';
    document.getElementById('shift-capacity').value = shift ? shift.capacity : 2;
    document.getElementById('modal-shift').classList.add('active');
}

function saveShift(event) {
    event.preventDefault();
    const id = document.getElementById('shift-id').value;
    const name = document.getElementById('shift-name').value.trim();
    const time = document.getElementById('shift-time').value;
    const capacity = parseInt(document.getElementById('shift-capacity').value) || 2;

    if (!name || !time) { alert('Nome e horário são obrigatórios.'); return; }

    if (id) {
        const index = state.shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            state.shifts[index].name = name;
            state.shifts[index].time = time;
            state.shifts[index].capacity = capacity;
        }
    } else {
        const newShift = { id: generateId(), name, time, capacity };
        state.shifts.push(newShift);
        const days = getWorkingDays();
        days.forEach(day => {
            state.schedule[`${newShift.id}-${day}`] = [];
        });
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
    if (!confirm('Tem certeza que deseja remover este horário?')) return;
    state.shifts = state.shifts.filter(s => s.id !== id);
    const days = getWorkingDays();
    days.forEach(day => delete state.schedule[`${id}-${day}`]);
    saveState();
    renderShifts();
    renderScheduleBoard();
}
