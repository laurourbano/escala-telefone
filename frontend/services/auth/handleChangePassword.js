function handleChangePassword(event) {
    event.preventDefault();
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (state.currentUser.password !== current) {
        showToast('Senha atual incorreta.', 'error');
        return;
    }
    if (newPw !== confirm) {
        showToast('Nova senha e confirmação não conferem.', 'error');
        return;
    }
    if (newPw.length < 4) {
        showToast('A senha deve ter pelo menos 4 caracteres.', 'warning');
        return;
    }

    const person = state.people.find(p => p.id === state.currentUser.id);
    if (person) person.password = newPw;
    state.currentUser.password = newPw;
    saveState();
    document.getElementById('modal-change-password').classList.remove('active');
    showToast('Senha alterada com sucesso!', 'success');
}
