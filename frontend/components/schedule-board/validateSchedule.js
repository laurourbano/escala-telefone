function validateSchedule() {
    var hasWarning = false;
    var hasError = false;

    document.querySelectorAll('.scheduled-person').forEach(function (element) {
        element.classList.remove('conflict-item', 'error-item', 'extra-item');
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
            hasWarning = true;
            var seen = 0;
            days.forEach(function (date) {
                state.shifts.forEach(function (shift) {
                    if ((state.schedule[shift.id + '-' + date] || []).indexOf(personId) !== -1) {
                        seen++;
                        if (seen > person.maxShifts) highlightPerson(shift.id, date, personId, 'extra-item');
                    }
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
        statusHtml = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos (2 no mesmo dia / Atestado)</span>';
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
