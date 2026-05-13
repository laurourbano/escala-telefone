function updateSwapTargetShifts(colleagueId) {
    const targetShiftSelect = document.getElementById('swap-target-shift');
    targetShiftSelect.innerHTML = '<option value="">Selecione o turno do colega...</option>';
    targetShiftSelect.disabled = !colleagueId;

    if (!colleagueId) return;

    const days = getWorkingDays();
    const options = [];

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const peopleInShift = state.schedule[key] || [];
            if (peopleInShift.includes(colleagueId)) {
                options.push({ shiftId: shift.id, date: day, label: `${shift.name} (${shift.time}) - ${formatDate(day)}` });
            }
        });
    });

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = `${opt.shiftId}|${opt.date}`;
        option.textContent = opt.label;
        targetShiftSelect.appendChild(option);
    });
}
