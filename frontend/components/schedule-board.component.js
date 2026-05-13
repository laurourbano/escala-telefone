function renderScheduleBoard() {
    scheduleBoard.innerHTML = '';

    var sortables = [];
    var days = getWorkingDays();

    var grid = document.createElement('div');
    grid.className = 'schedule-grid';

    var headerRow = document.createElement('div');
    headerRow.className = 'grid-row header-row';
    headerRow.innerHTML = '<div class="grid-cell time-cell">Horarios</div>' +
        days.map(function (day) { return '<div class="grid-cell day-cell">' + formatDate(day) + '</div>'; }).join('');
    grid.appendChild(headerRow);

    state.shifts.forEach(function (shift, index) {
        var row = document.createElement('div');
        row.className = 'grid-row ' + (index % 2 === 0 ? 'even-row' : 'odd-row');

        var rowHTML = '\
            <div class="grid-cell time-cell">\
                <span class="shift-name"><i class="ph ph-phone-incoming"></i> ' + shift.name + '</span>\
                <span class="shift-time"><i class="ph ph-clock"></i> ' + shift.time + '</span>\
            </div>\
        ';
        row.innerHTML = rowHTML;

        days.forEach(function (day) {
            var dayKey = shift.id + '-' + day;
            if (!state.schedule[dayKey]) state.schedule[dayKey] = [];

            var cell = document.createElement('div');
            cell.className = 'grid-cell dropzone-cell';

            var dropzone = document.createElement('div');
            dropzone.className = 'shift-dropzone';
            dropzone.dataset.shiftId = shift.id;
            dropzone.dataset.day = day;

            dropzone.innerHTML = state.schedule[dayKey].map(function (personId) {
                var person = state.people.find(function (person) { return person.id === personId; });
                if (!person) return '';
                return '\
                    <div class="scheduled-person" data-person-id="' + person.id + '">\
                        <span class="name">' + getFirstName(person.name) + '</span>\
                        <i class="ph ph-dots-six-vertical text-muted"></i>\
                    </div>\
                ';
            }).join('');

            cell.appendChild(dropzone);
            row.appendChild(cell);
        });

        grid.appendChild(row);
    });

    scheduleBoard.appendChild(grid);

    document.querySelectorAll('.shift-dropzone').forEach(function (dropzone) {
        sortables.push(new Sortable(dropzone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function (event) {
                var personId = event.item.dataset.personId;
                var targetDay = event.to.dataset.day;
                var person = state.people.find(function (p) { return p.id === personId; });
                if (!person) return;

                var isDoubleBooked = Array.from(document.querySelectorAll('.shift-dropzone'))
                    .filter(function (dz) { return dz.dataset.day === targetDay && dz !== event.to; })
                    .some(function (dz) { return Array.from(dz.children).some(function (child) { return child.dataset.personId === personId; }); });

                if (isDoubleBooked) {
                    event.from.appendChild(event.item);
                    alert('Esta pessoa ja esta escalada em outro turno neste dia.');
                    return;
                }

                var totalShifts = Array.from(document.querySelectorAll('.shift-dropzone'))
                    .reduce(function (count, dz) { return count + Array.from(dz.children).filter(function (child) { return child.dataset.personId === personId; }).length; }, 0);

                if (totalShifts > person.maxShifts) {
                    event.from.appendChild(event.item);
                    alert(person.name + ' ja atingiu o limite maximo de ' + person.maxShifts + ' turno' + (person.maxShifts !== 1 ? 's' : '') + '.');
                    return;
                }

                updateScheduleFromDOM();
            }
        }));
    });

    validateSchedule();
}

function updateScheduleFromDOM() {
    var dropzones = document.querySelectorAll('.shift-dropzone');
    dropzones.forEach(function (dropzone) {
        var shiftId = dropzone.dataset.shiftId;
        var day = dropzone.dataset.day;
        var dayKey = shiftId + '-' + day;
        var peopleIds = Array.from(dropzone.children).map(function (child) { return child.dataset.personId; });
        state.schedule[dayKey] = peopleIds;
    });
    saveState();
    validateSchedule();
    var selectedPersonId = document.getElementById('select-person-schedule').value;
    if (selectedPersonId) {
        renderPersonalSchedule(selectedPersonId);
    }
}

function validateSchedule() {
    var hasWarning = false;
    var hasError = false;

    document.querySelectorAll('.scheduled-person').forEach(function (element) {
        element.classList.remove('conflict-item', 'error-item');
    });

    var personShiftCount = {};
    var days = getWorkingDays();
    var personDays = {};
    var personSameDayErrors = new Set();

    state.shifts.forEach(function (shift) {
        days.forEach(function (day) {
            var dayKey = shift.id + '-' + day;
            var scheduledIds = state.schedule[dayKey] || [];

            scheduledIds.forEach(function (personId) {
                if (!personDays[personId]) personDays[personId] = [];
                personDays[personId].push(day);
                var occurrences = personDays[personId].filter(function (date) { return date === day; }).length;
                if (occurrences > 1) {
                    personSameDayErrors.add(personId + '-' + day);
                }
            });
        });
    });

    state.shifts.forEach(function (shift) {
        days.forEach(function (day) {
            var dayKey = shift.id + '-' + day;
            var scheduledIds = state.schedule[dayKey] || [];

            if (scheduledIds.length > shift.capacity || (scheduledIds.length > 0 && scheduledIds.length < shift.capacity)) {
                hasWarning = true;
            }

            scheduledIds.forEach(function (personId) {
                personShiftCount[personId] = (personShiftCount[personId] || 0) + 1;
                var person = state.people.find(function (person) { return person.id === personId; });

                if (person) {
                    if (isPersonUnavailable(person, day)) {
                        hasError = true;
                        highlightPerson(shift.id, day, personId, 'error-item');
                    }

                    if (person.preferredShifts.length > 0 && person.preferredShifts.indexOf(shift.id) === -1) {
                        hasWarning = true;
                        highlightPerson(shift.id, day, personId, 'conflict-item');
                    }
                }

                if (personSameDayErrors.has(personId + '-' + day)) {
                    hasError = true;
                    highlightPerson(shift.id, day, personId, 'error-item');
                }
            });
        });
    });

    for (var personId in personShiftCount) {
        var person = state.people.find(function (person) { return person.id === personId; });
        if (person && personShiftCount[personId] > person.maxShifts) {
            hasError = true;
            state.shifts.forEach(function (shift) {
                days.forEach(function (date) {
                    if ((state.schedule[shift.id + '-' + date] || []).indexOf(personId) !== -1) highlightPerson(shift.id, date, personId, 'error-item');
                });
            });
        }
    }

    var statusElement = document.getElementById('validation-status');

    var unfilledPerDay = {};
    var totalUnfilled = 0;
    state.shifts.forEach(function (shift) {
        days.forEach(function (day) {
            var key = shift.id + '-' + day;
            var assigned = state.schedule[key] || [];
            var unfilled = Math.max(0, shift.capacity - assigned.length);
            unfilledPerDay[day] = (unfilledPerDay[day] || 0) + unfilled;
            totalUnfilled += unfilled;
        });
    });

    var maxUnfilledPerDay = Math.max.apply(null, Object.keys(unfilledPerDay).map(function (k) { return unfilledPerDay[k]; }).concat([0]));
    var defaultMaxShifts = 5;
    var minByDay = maxUnfilledPerDay;
    var minByTotal = Math.ceil(totalUnfilled / defaultMaxShifts);
    var missingEmployees = Math.max(minByDay, minByTotal);

    var statusHtml = '';
    if (hasError) {
        statusHtml = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos (2 no mesmo dia / Excesso / Atestado)</span>';
    } else if (hasWarning) {
        statusHtml = '<span class="status-badge warning"><i class="ph ph-warning"></i> Distribuicao Desbalanceada</span>';
    } else {
        statusHtml = '<span class="status-badge success"><i class="ph ph-check-circle"></i> Equilibrado</span>';
    }

    statusElement.innerHTML = statusHtml;

    if (totalUnfilled > 0) {
        statusElement.innerHTML += '<span class="status-badge warning" style="margin-left:8px"><i class="ph ph-users"></i> Faltam ~' + missingEmployees + ' funcionario' + (missingEmployees !== 1 ? 's' : '') + ' (' + totalUnfilled + ' vaga' + (totalUnfilled !== 1 ? 's' : '') + ')</span>';
    }
}

function highlightPerson(shiftId, day, personId, className) {
    var dropzone = document.querySelector('.shift-dropzone[data-shift-id="' + shiftId + '"][data-day="' + day + '"]');
    if (dropzone) {
        var element = dropzone.querySelector('.scheduled-person[data-person-id="' + personId + '"]');
        if (element) element.classList.add(className);
    }
}
