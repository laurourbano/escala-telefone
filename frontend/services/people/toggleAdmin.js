function toggleAdmin(id, skipConfirm = false) {
    if (!isAdmin()) return;
    const person = state.people.find(p => p.id === id);
    if (!person) return;
    const action = person.isAdmin ? 'remover o acesso de administrador de' : 'tornar administrador';
    
    if (!skipConfirm) {
        showConfirm({
            title: 'Confirmar Ação',
            message: `Tem certeza que deseja ${action} ${getFirstName(person.name)}?`,
            onConfirm: () => toggleAdmin(id, true)
        });
        return;
    }
    
    person.isAdmin = !person.isAdmin;
    if (state.currentUser && state.currentUser.id === person.id) {
        state.currentUser.isAdmin = person.isAdmin;
    }
    saveState();
    renderPeople();
}
