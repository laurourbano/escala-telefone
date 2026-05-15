function openSwapModal(myShiftId, date) {
    if (!state.currentUser) return;
    const shift = state.shifts.find(shift => shift.id === myShiftId);
    if (!shift) return;

    document.getElementById('swap-my-shift-id').value = myShiftId;
    document.getElementById('swap-my-date').value = date;
    document.getElementById('swap-my-details').innerText = `${shift.name} (${shift.time}) em ${formatDate(date)}`;

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
