function acceptSwap(notificationId) {
    const notification = state.notifications.find(notif => notif.id === notificationId);
    if (!notification) return;

    const myKey = `${notification.targetShiftId}-${notification.targetDate}`;
    const theirKey = `${notification.myShiftId}-${notification.myDate}`;

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
