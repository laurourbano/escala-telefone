function sortPeople() {
    state.people.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
