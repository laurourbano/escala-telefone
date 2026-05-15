function handleLogout() {
    state.currentUser = null;
    saveState();
    checkAuth();
    document.getElementById('profile-dropdown').classList.remove('active');
    switchTab('escala');
}
