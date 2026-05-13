function openShiftModal(shift = null) {
    document.getElementById('modal-shift-title').innerText = shift ? 'Editar Horário' : 'Novo Horário';
    document.getElementById('shift-id').value = shift ? shift.id : '';
    document.getElementById('shift-name').value = shift ? shift.name : '';
    document.getElementById('shift-time').value = shift ? shift.time : '';
    document.getElementById('shift-capacity').value = shift ? shift.capacity : 2;
    document.getElementById('modal-shift').classList.add('active');
}
