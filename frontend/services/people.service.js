function sortPeople() {
    state.people.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function openPersonModal(person = null) {
    document.getElementById('modal-person-title').innerText = person ? 'Editar Pessoa' : 'Nova Pessoa';
    document.getElementById('person-id').value = person ? person.id : '';
    document.getElementById('person-name').value = person ? person.name : '';
    document.getElementById('person-status').value = person ? person.status : 'disponivel';
    document.getElementById('person-max-shifts').value = person ? person.maxShifts : 5;
    document.getElementById('person-unavailability-start').value = person ? (person.unavailabilityStart || '') : '';
    document.getElementById('person-unavailability-end').value = person ? (person.unavailabilityEnd || '') : '';

    // Populate preferred shifts checkboxes
    const container = document.getElementById('person-preferred-shifts');
    container.innerHTML = state.shifts.map(shift => `
        <label class="checkbox-label">
            <input type="checkbox" value="${shift.id}" ${person && person.preferredShifts && person.preferredShifts.includes(shift.id) ? 'checked' : ''}>
            ${shift.name}
        </label>
    `).join('');

    // Show/hide unavailability dates based on status
    const status = person ? person.status : 'disponivel';
    document.getElementById('unavailability-dates').style.display = status === 'disponivel' ? 'none' : 'block';

    document.getElementById('modal-person').classList.add('active');
}

function savePerson(event) {
    event.preventDefault();
    const id = document.getElementById('person-id').value;
    const name = toTitleCase(document.getElementById('person-name').value.trim());
    const status = document.getElementById('person-status').value;
    const maxShifts = parseInt(document.getElementById('person-max-shifts').value) || 5;
    const preferredCheckboxes = document.querySelectorAll('#person-preferred-shifts input:checked');
    const preferredShifts = Array.from(preferredCheckboxes).map(cb => cb.value);
    const unavailabilityStart = document.getElementById('person-unavailability-start').value;
    const unavailabilityEnd = document.getElementById('person-unavailability-end').value;

    if (!name) { alert('O nome é obrigatório.'); return; }

    if (id) {
        const index = state.people.findIndex(p => p.id === id);
        if (index !== -1) {
            const wasUnavailable = state.people[index].status !== 'disponivel';
            state.people[index].name = name;
            state.people[index].status = status;
            state.people[index].maxShifts = maxShifts;
            state.people[index].preferredShifts = preferredShifts;

            if (status === 'disponivel') {
                state.people[index].unavailabilityStart = '';
                state.people[index].unavailabilityEnd = '';
            } else {
                state.people[index].unavailabilityStart = unavailabilityStart;
                state.people[index].unavailabilityEnd = unavailabilityEnd;
            }
        }
    } else {
        state.people.push({
            id: generateId(),
            name,
            status,
            maxShifts,
            preferredShifts,
            password: '3820',
            isAdmin: false,
            unavailabilityStart: status === 'disponivel' ? '' : unavailabilityStart,
            unavailabilityEnd: status === 'disponivel' ? '' : unavailabilityEnd
        });
    }

    sortPeople();
    saveState();
    renderPeople();
    document.getElementById('modal-person').classList.remove('active');
}

function editPerson(id) {
    const person = state.people.find(p => p.id === id);
    if (person) openPersonModal(person);
}

function deletePerson(id) {
    if (!confirm('Tem certeza que deseja remover esta pessoa?')) return;
    state.people = state.people.filter(p => p.id !== id);
    Object.keys(state.schedule).forEach(key => {
        state.schedule[key] = state.schedule[key].filter(pid => pid !== id);
    });
    saveState();
    renderPeople();
    renderScheduleBoard();
}

function toggleAdmin(id) {
    if (!isAdmin()) return;
    const person = state.people.find(p => p.id === id);
    if (!person) return;
    const action = person.isAdmin ? 'remover o acesso de administrador de' : 'tornar administrador';
    if (!confirm(`Tem certeza que deseja ${action} ${getFirstName(person.name)}?`)) return;
    person.isAdmin = !person.isAdmin;
    if (state.currentUser && state.currentUser.id === person.id) {
        state.currentUser.isAdmin = person.isAdmin;
    }
    saveState();
    renderPeople();
}

function populatePersonSelect() {
    const select = document.getElementById('select-person-schedule');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione uma pessoa...</option>' +
        state.people
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(person => `<option value="${person.id}">${person.name}</option>`)
            .join('');
    if (currentValue && state.people.some(p => p.id === currentValue)) {
        select.value = currentValue;
    }
}
