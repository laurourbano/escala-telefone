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
