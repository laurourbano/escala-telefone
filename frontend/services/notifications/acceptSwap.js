function acceptSwap(notificationId) {
    const notification = state.notifications.find(notif => notif.id === notificationId);
    if (!notification) return;

    const myKey = `${notification.targetShiftId}-${notification.targetDate}`;
    const theirKey = `${notification.myShiftId}-${notification.myDate}`;

    if (notification.myDate !== notification.targetDate) {
        if (hasScheduleConflict(state.currentUser.id, notification.myDate)) {
            showToast('Voce ja tem outra escala no dia proposto. A troca foi bloqueada.', 'error');
            return;
        }

        if (hasScheduleConflict(notification.fromId, notification.targetDate)) {
            showToast('O solicitante ja tem outra escala no dia proposto. A troca foi bloqueada.', 'error');
            return;
        }
    }

    state.schedule[myKey] = (state.schedule[myKey] || []).filter(id => id !== state.currentUser.id);
    state.schedule[myKey].push(notification.fromId);

    state.schedule[theirKey] = (state.schedule[theirKey] || []).filter(id => id !== notification.fromId);
    state.schedule[theirKey].push(state.currentUser.id);

    notification.status = 'accepted';
    saveState();
    renderNotifications();
    updateNotificationBadge();
    renderPersonalSchedule(state.currentUser.id);
    renderScheduleBoard();
    showToast("Troca realizada com sucesso!", "success");
}
