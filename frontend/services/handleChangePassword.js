function handleChangePassword(event) {
    event.preventDefault();
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (state.currentUser.password !== current) {
        alert('Senha atual incorreta.');
        return;
    }
    if (newPw !== confirm) {
        alert('Nova senha e confirmação não conferem.');
        return;
    }
    if (newPw.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres.');
        return;
    }

    const person = state.people.find(p => p.id === state.currentUser.id);
    if (person) person.password = newPw;
    state.currentUser.password = newPw;
    saveState();
    document.getElementById('modal-change-password').classList.remove('active');
    alert('Senha alterada com sucesso!');
}
