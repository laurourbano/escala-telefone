function renderPeople() {
    sortPeople();
    peopleList.innerHTML = '';
    var currentIsAdmin = isAdmin();
    var totalShifts = state.shifts.length;
    var days = getWorkingDays();
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
        var assignedCount = 0;
        for (var key in state.schedule) {
            if (state.schedule[key].indexOf(person.id) !== -1) assignedCount++;
        }
        var noShiftsAssigned = assignedCount === 0 && person.maxShifts > 0;
        var partialShifts = person.preferredShifts && person.preferredShifts.length < totalShifts;
        var evidenceBadge = '';
        if (person.maxShifts === 0) {
            evidenceBadge = '<span class="badge" style="background: rgba(148,163,184,0.15); border: 1px solid rgba(148,163,184,0.4); color: #94a3b8;"><i class="ph ph-x-circle"></i> 0 horários/semana</span>';
            card.classList.add('card-zero-shifts');
        } else if (noShiftsAssigned) {
            evidenceBadge = '<span class="badge" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: var(--danger);"><i class="ph ph-warning-circle"></i> Sem turnos</span>';
            card.classList.add('card-no-shifts');
        } else if (partialShifts) {
            evidenceBadge = '<span class="badge" style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: var(--warning);"><i class="ph ph-sliders"></i> Turnos: ' + person.preferredShifts.length + '/' + totalShifts + '</span>';
            card.classList.add('card-partial-shifts');
        }
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
                ' + evidenceBadge + '\
                ' + (person.status !== 'disponivel' && (person.unavailabilityStart || person.unavailabilityEnd)
            ? '<span class="badge" style="background: var(--bg-card); border: 1px solid var(--border);">\
                        ' + (person.unavailabilityStart ? formatDate(person.unavailabilityStart) : '...') + ' - \
                        ' + (person.unavailabilityEnd ? formatDate(person.unavailabilityEnd) : '...') + '\
                    </span>' : '') + '\
                <span>\
                    ' + (person.maxShifts === 0
                ? 'Sem escalas'
                : person.maxShifts + ' horários por semana') + '\
                </span>\
            </div>\
        ';
        peopleList.appendChild(card);
    });
    populatePersonSelect();
}
