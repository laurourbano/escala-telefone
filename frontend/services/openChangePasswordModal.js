function openChangePasswordModal() {
    if (!state.currentUser) return;
    document.getElementById('pw-email').value = generateEmail(state.currentUser.name);
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
    document.getElementById('modal-change-password').classList.add('active');
    document.getElementById('profile-dropdown').classList.remove('active');
}
