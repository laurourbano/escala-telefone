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

    if (myDate !== targetDate) {
        if (hasScheduleConflict(state.currentUser.id, targetDate)) {
            showToast('Voce ja esta escalado no dia do turno solicitado. A troca nao pode prosseguir.', 'error');
            return;
        }

        if (hasScheduleConflict(targetPersonId, myDate)) {
            showToast('O colega ja esta escalado no dia do seu turno. A troca nao pode prosseguir.', 'error');
            return;
        }
    }

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
