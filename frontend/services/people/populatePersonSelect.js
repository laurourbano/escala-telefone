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
