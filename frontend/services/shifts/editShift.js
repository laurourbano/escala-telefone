function editShift(id) {
    const shift = state.shifts.find(s => s.id === id);
    if (shift) openShiftModal(shift);
}
