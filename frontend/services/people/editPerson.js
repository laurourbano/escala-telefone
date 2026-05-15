function editPerson(id) {
    const person = state.people.find(p => p.id === id);
    if (person) openPersonModal(person);
}
