function saveShift(event) {
    event.preventDefault();
    const id = document.getElementById('shift-id').value;
    const name = document.getElementById('shift-name').value.trim();
    const time = document.getElementById('shift-time').value;
    var capVal = parseInt(document.getElementById('shift-capacity').value);
    const capacity = isNaN(capVal) ? 2 : capVal;

    if (!name || !time) { 
        showToast('Nome e horário são obrigatórios.', 'warning'); 
        return; 
    }
    
    if (id) {
        const index = state.shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            state.shifts[index] = { ...state.shifts[index], name, time, capacity: parseInt(capacity) };
        }
    } else {
        state.shifts.push({
            id: generateId(),
            name,
            time,
            capacity: parseInt(capacity)
        });
    }

    sortShifts();
    saveState();
    renderShifts();
    renderScheduleBoard();
    
    // Close modal
    document.getElementById('modal-shift').classList.remove('active');
    showToast('Turno salvo com sucesso!', 'success');
}
