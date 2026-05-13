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
