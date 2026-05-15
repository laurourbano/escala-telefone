function handleSwapRequest(event) {
    event.preventDefault();
    const myShiftId = document.getElementById('swap-my-shift-id').value;
    const myDate = document.getElementById('swap-my-date').value;
    const targetPersonId = document.getElementById('swap-target-person').value;
    const targetShiftRaw = document.getElementById('swap-target-shift').value;

    if (!targetPersonId || !targetShiftRaw) {
        showToast('Selecione um colega e um turno para troca.', 'warning');
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
    showToast('Solicitação de troca enviada!', 'success');
    document.getElementById('modal-swap').classList.remove('active');
    updateNotificationBadge();
}
