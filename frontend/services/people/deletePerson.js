function deletePerson(id) {
    showConfirm({
        title: 'Remover Pessoa',
        message: 'Tem certeza que deseja remover esta pessoa?',
        type: 'danger',
        onConfirm: () => {
            state.people = state.people.filter(p => p.id !== id);
            Object.keys(state.schedule).forEach(key => {
                state.schedule[key] = state.schedule[key].filter(pid => pid !== id);
            });
            saveState();

            renderPeople();
            renderScheduleBoard();
            showToast('Pessoa removida com sucesso', 'success');
        }
    });
}

