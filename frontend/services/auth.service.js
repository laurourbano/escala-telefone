function isAdmin() {
    if (!state.currentUser) return false;
    if (generateEmail(state.currentUser.name) === 'lauro.urbano@crf-pr.org.br') return true;
    return state.currentUser.isAdmin === true;
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.toLowerCase().trim();
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    const email = username.includes('@') ? username : `${username}@crf-pr.org.br`;

    let person = state.people.find(person => generateEmail(person.name) === email && person.password === password);

    if (!person && email.endsWith('@crf-pr.org.br') && password === '3820') {
        let existingPerson = state.people.find(person => generateEmail(person.name) === email);

        if (existingPerson) {
            existingPerson.password = '3820';
            person = existingPerson;
        } else {
            const namePart = email.split('@')[0];
            const rawName = namePart.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

            person = {
                id: generateId(),
                name: toTitleCase(rawName),
                status: 'disponivel',
                maxShifts: 5,
                preferredShifts: state.shifts.map(shift => shift.id),
                password: '3820'
            };
            state.people.push(person);
        }
        saveState();
        renderPeople();
        populatePersonSelect();
    }

    if (person) {
        state.currentUser = person;
        saveState();
        checkAuth();
        errorElement.classList.add('hidden');
        switchTab('escala');
        syncLoginWithServer(email, password);
    } else {
        errorElement.classList.remove('hidden');
    }
}

function handleLogout() {
    state.currentUser = null;
    saveState();
    checkAuth();
    document.getElementById('profile-dropdown').classList.remove('active');
    switchTab('escala');
}

function openChangePasswordModal() {
    if (!state.currentUser) return;
    document.getElementById('pw-email').value = generateEmail(state.currentUser.name);
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
    document.getElementById('modal-change-password').classList.add('active');
    document.getElementById('profile-dropdown').classList.remove('active');
}

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
