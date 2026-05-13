function renderShifts() {
    shiftsList.innerHTML = '';
    state.shifts.forEach(function (shift) {
        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = '\
            <div class="card-header">\
                <span class="card-title">' + shift.name + '</span>\
                <div class="card-actions">\
                    <button onclick="editShift(\'' + shift.id + '\')"><i class="ph ph-pencil"></i></button>\
                    <button class="delete-btn" onclick="deleteShift(\'' + shift.id + '\')"><i class="ph ph-trash"></i></button>\
                </div>\
            </div>\
            <div class="card-meta">\
                <span><i class="ph ph-clock"></i> ' + shift.time + '</span>\
                <span> Vagas: ' + shift.capacity + '</span>\
            </div>\
        ';
        shiftsList.appendChild(card);
    });
    var prefContainer = document.getElementById('person-preferred-shifts');
    prefContainer.innerHTML = state.shifts.map(function (shift) {
        return '\
            <label class="checkbox-label">\
                <input type="checkbox" name="pref-shifts" value="' + shift.id + '">\
                <span>' + shift.name + '</span>\
            </label>\
        ';
    }).join('');
}
