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
                    showToast('Esta pessoa já está escalada em outro turno neste dia.', 'error');
                    return;
                }

                var totalShifts = Array.from(document.querySelectorAll('.shift-dropzone'))
                    .reduce(function (count, dz) { return count + Array.from(dz.children).filter(function (child) { return child.dataset.personId === personId; }).length; }, 0);

                if (totalShifts > person.maxShifts) {
                    event.from.appendChild(event.item);
                    showToast(person.name + ' já atingiu o limite máximo de ' + person.maxShifts + ' turno' + (person.maxShifts !== 1 ? 's' : '') + '.', 'warning');
                    return;
                }

                updateScheduleFromDOM();
            }
        }));
    });

    validateSchedule();
}
