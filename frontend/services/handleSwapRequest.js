function handleSwapRequest(event) {
    event.preventDefault();
    const myShiftId = document.getElementById('swap-my-shift-id').value;
    const myDate = document.getElementById('swap-my-date').value;
    const targetPersonId = document.getElementById('swap-target-person').value;
    const targetShiftRaw = document.getElementById('swap-target-shift').value;

    if (!targetPersonId || !targetShiftRaw) {
        alert('Selecione um colega e um turno para troca.');
        return;
    }

    const [targetShiftId, targetDate] = targetShiftRaw.split('|');

    state.notifications.push({
        id: generateId(),
        fromId: state.currentUser.id,
        fromName: state.currentUser.name,
        toId: targetPersonId,
        myShiftId,
        myDate,
        targetShiftId,
        targetDate,
        status: 'pending',
        timestamp: new Date().toISOString()
    });

    saveState();
    alert('Solicitação de troca enviada!');
    document.getElementById('modal-swap').classList.remove('active');
    updateNotificationBadge();
}
