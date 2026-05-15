function handleLogin(event) {
    event.preventDefault();
    console.log('handleLogin: iniciando');
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
                maxShifts: 4,
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
        console.log('handleLogin: pessoa encontrada/criada', person.name);
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
