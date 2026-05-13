function renderPeople() {
    sortPeople();
    peopleList.innerHTML = '';
    var currentIsAdmin = isAdmin();
    state.people.forEach(function (person) {
        var card = document.createElement('div');
        card.className = 'card';
        var isOwner = generateEmail(person.name) === 'lauro.urbano@crf-pr.org.br';
        var adminBadge = person.isAdmin || isOwner
            ? '<span class="badge" style="background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.5); color: #ca8a04;"><i class="ph ph-crown-simple"></i> Admin</span>'
            : '';
        var toggleAdminBtn = currentIsAdmin && !isOwner
            ? '<button title="' + (person.isAdmin ? 'Remover admin' : 'Tornar admin') + '" onclick="toggleAdmin(\'' + person.id + '\')" style="color: ' + (person.isAdmin ? 'var(--danger)' : 'var(--accent)') + ';"><i class="ph ph-crown-simple"></i></button>'
            : '';
        card.innerHTML = '\
            <div class="card-header">\
                <span class="card-title">' + getFirstName(person.name) + '</span>\
                <div class="card-actions">\
                    ' + toggleAdminBtn + '\
                    <button onclick="editPerson(\'' + person.id + '\')"><i class="ph ph-pencil"></i></button>\
                    <button class="delete-btn" onclick="deletePerson(\'' + person.id + '\')"><i class="ph ph-trash"></i></button>\
                </div>\
            </div>\
            <div class="card-meta" style="flex-wrap: wrap;">\
                <span class="badge ' + person.status + '">' + person.status + '</span>\
                ' + adminBadge + '\
                ' + (person.status !== 'disponivel' && (person.unavailabilityStart || person.unavailabilityEnd)
            ? '<span class="badge" style="background: var(--bg-card); border: 1px solid var(--border);">\
                        ' + (person.unavailabilityStart ? formatDate(person.unavailabilityStart) : '...') + ' - \
                        ' + (person.unavailabilityEnd ? formatDate(person.unavailabilityEnd) : '...') + '\
                    </span>' : '') + '\
                <span>\
                    ' + (person.maxShifts === 0
                ? 'Sem escalas'
                : 'Max: ' + person.maxShifts + ' turnos') + '\
                </span>\
            </div>\
        ';
        peopleList.appendChild(card);
    });
    populatePersonSelect();
}
