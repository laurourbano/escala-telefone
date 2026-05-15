function openPersonModal(person = null) {
    document.getElementById('modal-person-title').innerText = person ? 'Editar Pessoa' : 'Nova Pessoa';
    document.getElementById('person-id').value = person ? person.id : '';
    document.getElementById('person-name').value = person ? person.name : '';
    document.getElementById('person-status').value = person ? person.status : 'disponivel';
    document.getElementById('person-max-shifts').value = person ? person.maxShifts : 4;
    document.getElementById('person-unavailability-start').value = person ? (person.unavailabilityStart || '') : '';
    document.getElementById('person-unavailability-end').value = person ? (person.unavailabilityEnd || '') : '';

    const container = document.getElementById('person-preferred-shifts');
    container.innerHTML = state.shifts.map(shift => `
        <label class="checkbox-label">
            <input type="checkbox" name="pref-shifts" value="${shift.id}" ${person && person.preferredShifts && person.preferredShifts.includes(shift.id) ? 'checked' : ''}>
            ${shift.name}
        </label>
    `).join('');

    const status = person ? person.status : 'disponivel';
    document.getElementById('unavailability-dates').style.display = status === 'disponivel' ? 'none' : 'block';

    document.getElementById('modal-person').classList.add('active');
}
