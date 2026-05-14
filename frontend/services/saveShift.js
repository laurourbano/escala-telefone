function saveShift(event) {
    event.preventDefault();
    const id = document.getElementById('shift-id').value;
    const name = document.getElementById('shift-name').value.trim();
    const time = document.getElementById('shift-time').value;
    var capVal = parseInt(document.getElementById('shift-capacity').value);
    const capacity = isNaN(capVal) ? 2 : capVal;

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
