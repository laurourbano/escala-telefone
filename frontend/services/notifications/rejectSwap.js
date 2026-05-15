function rejectSwap(notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    notification.status = 'rejected';
    saveState();
    renderNotifications();
    updateNotificationBadge();
}
