function deleteShift(id) {
    showConfirm({
        title: 'Remover Turno',
        message: 'Tem certeza que deseja remover este horário?',
        type: 'danger',
        onConfirm: () => {
            state.shifts = state.shifts.filter(s => s.id !== id);
            Object.keys(state.schedule).forEach(key => {
                const parts = key.split('-');
                if (parts[0] === id) {
                    delete state.schedule[key];
                }
            });
            saveState();
            renderShifts();
            renderScheduleBoard();
            showToast('Turno removido com sucesso', 'success');
        }
    });
}
