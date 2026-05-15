function checkAuth() {
    if (state.currentUser) {
        document.getElementById('login-overlay').classList.remove('active');
        document.getElementById('topbar-user-actions').style.display = 'flex';
        document.getElementById('display-user-name').innerText = getFirstName(state.currentUser.name);

        const adminTabs = document.querySelectorAll('[data-tab="pessoas"], [data-tab="horarios"], [data-tab="config"]');
        const adminActions = document.querySelectorAll('#btn-generate, #btn-next-week');
        if (isAdmin()) {
            adminTabs.forEach(tab => tab.classList.remove('hidden-admin'));
            adminActions.forEach(btn => btn.classList.remove('hidden-admin'));
        } else {
            adminTabs.forEach(tab => tab.classList.add('hidden-admin'));
            adminActions.forEach(btn => btn.classList.add('hidden-admin'));
        }

        updateNotificationBadge();
    } else {
        document.getElementById('login-overlay').classList.add('active');
        document.getElementById('topbar-user-actions').style.display = 'none';
    }
}
