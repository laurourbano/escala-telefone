function deleteShift(id) {
    if (!confirm('Tem certeza que deseja remover este horário?')) return;
    state.shifts = state.shifts.filter(s => s.id !== id);
    const days = getWorkingDays();
    days.forEach(day => delete state.schedule[`${id}-${day}`]);
    saveState();

    renderShifts();
    renderScheduleBoard();
}
