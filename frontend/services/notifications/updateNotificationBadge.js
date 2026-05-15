function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    if (!state.currentUser) {
        badge.style.display = 'none';
        return;
    }
    const pending = state.notifications.filter(n =>
        n.toId === state.currentUser.id && n.status === 'pending'
    );
    if (pending.length > 0) {
        badge.style.display = 'flex';
        badge.innerText = pending.length;
    } else {
        badge.style.display = 'none';
    }
}
