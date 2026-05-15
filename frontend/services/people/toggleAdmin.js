function toggleAdmin(id, skipConfirm = false) {
    if (!isAdmin()) return;
    const person = state.people.find(p => p.id === id);
    if (!person) return;
    const action = person.isAdmin ? 'remover o acesso de administrador de' : 'tornar administrador';
    
    if (!skipConfirm) {
        showConfirm(
            'Confirmar Ação',
            `Tem certeza que deseja ${action} ${getFirstName(person.name)}?`,
            () => toggleAdmin(id, true)
        );
        return;
    }
    
    person.isAdmin = !person.isAdmin;
    if (state.currentUser && state.currentUser.id === person.id) {
        state.currentUser.isAdmin = person.isAdmin;
    }
    saveState();
    renderPeople();
}
