function handleStatusChange(value) {
    document.getElementById('unavailability-dates').style.display = value === 'disponivel' ? 'none' : 'block';
    if (value === 'indisponivel') {
        document.getElementById('person-max-shifts').value = '0';
        document.querySelectorAll('#person-preferred-shifts input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
    }
}
