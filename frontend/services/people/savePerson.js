function savePerson(event, skipConfirm = false) {
    if (event) event.preventDefault();
    const id = document.getElementById('person-id').value;
    const name = toTitleCase(document.getElementById('person-name').value.trim());
    const status = document.getElementById('person-status').value;
    var maxShiftsVal = parseInt(document.getElementById('person-max-shifts').value);
    var maxShifts = isNaN(maxShiftsVal) ? 4 : maxShiftsVal;
    const preferredCheckboxes = document.querySelectorAll('#person-preferred-shifts input:checked');
    const preferredShifts = Array.from(preferredCheckboxes).map(cb => cb.value);
    var finalStatus = maxShifts === 0 || preferredShifts.length === 0 ? 'indisponivel' : status;
    const unavailabilityStart = document.getElementById('person-unavailability-start').value;
    const unavailabilityEnd = document.getElementById('person-unavailability-end').value;

    if (!name) { showToast('O nome é obrigatório.', 'warning'); return; }

    // Require confirmation only if updating
    if (id && !skipConfirm) {
        showConfirm({
            title: 'Confirmar Atualização',
            message: `Tem certeza que deseja salvar as alterações de ${getFirstName(name)}?`,
            onConfirm: () => savePerson(null, true)
        });
        return;
    }

    let isNew = false;
    if (id) {
        const index = state.people.findIndex(p => p.id === id);
        if (index !== -1) {
            state.people[index].name = name;
            state.people[index].status = finalStatus;
            state.people[index].maxShifts = maxShifts;
            state.people[index].preferredShifts = preferredShifts;

            if (finalStatus === 'disponivel') {
                state.people[index].unavailabilityStart = '';
                state.people[index].unavailabilityEnd = '';
            } else {
                state.people[index].unavailabilityStart = unavailabilityStart;
                state.people[index].unavailabilityEnd = unavailabilityEnd;
            }
        }
    } else {
        isNew = true;
        state.people.push({
            id: generateId(),
            name,
            status: finalStatus,
            maxShifts,
            preferredShifts,
            password: '3820',
            isAdmin: false,
            unavailabilityStart: finalStatus === 'disponivel' ? '' : unavailabilityStart,
            unavailabilityEnd: finalStatus === 'disponivel' ? '' : unavailabilityEnd
        });
    }

    if (maxShifts === 0 || preferredShifts.length === 0) {
        document.getElementById('person-status').value = 'indisponivel';
        document.getElementById('unavailability-dates').style.display = 'block';
    }
    sortPeople();
    saveState();
    renderPeople();
    document.getElementById('modal-person').classList.remove('active');
    
    if (isNew) {
        showToast(`${getFirstName(name)} foi adicionado(a) com sucesso!`, 'success');
    } else {
        showToast(`${getFirstName(name)} foi atualizado(a) com sucesso!`, 'success');
    }
}
