function renderPersonalSchedule(personId) {
    var container = document.getElementById('personal-table-container');
    if (!personId) {
        container.innerHTML = '\
            <div class="empty-state">\
                <i class="ph ph-calendar-blank" style="font-size: 3rem; color: var(--text-muted); opacity: 0.3;"></i>\
                <p>Selecione seu nome para ver seus horarios</p>\
            </div>\
        ';
        return;
    }
    var days = getWorkingDays();
    var assignments = [];
    days.forEach(function (day) {
        state.shifts.forEach(function (shift) {
            var dayKey = shift.id + '-' + day;
            if ((state.schedule[dayKey] || []).indexOf(personId) !== -1) {
                assignments.push({
                    date: day,
                    shiftId: shift.id,
                    shiftName: shift.name,
                    shiftTime: shift.time
                });
            }
        });
    });
    if (assignments.length === 0) {
        container.innerHTML = '\
            <div class="empty-state">\
                <i class="ph ph-calendar-x" style="font-size: 3rem; color: var(--text-muted); opacity: 0.3;"></i>\
                <p>Voce nao possui turnos agendados para este periodo.</p>\
            </div>\
        ';
        return;
    }
    assignments.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var person = state.people.find(function (p) { return p.id === personId; });
    var personName = person ? person.name : '';
    var html = '\
        <div class="personal-header-print" style="margin-bottom: 1.5rem;">\
            <h2 style="color: var(--primary); font-size: 1.5rem;">Escala Individual: ' + getFirstName(personName) + '</h2>\
            <p style="color: var(--text-muted); font-size: 0.9rem;">Periodo: ' + formatDate(days[0]) + ' ate ' + formatDate(days[days.length - 1]) + '</p>\
        </div>\
        <table class="personal-table">\
            <thead>\
                <tr>\
                    <th>Data</th>\
                    <th>Escala / Turno</th>\
                    <th>Horario</th>\
                </tr>\
            </thead>\
            <tbody>\
    ';
    assignments.forEach(function (assignment) {
        html += '\
                <tr>\
                    <td><strong>' + formatDate(assignment.date) + '</strong></td>\
                    <td><i class="ph ph-phone-incoming" style="color: var(--secondary); margin-right: 0.5rem;"></i> ' + assignment.shiftName + '</td>\
                    <td><i class="ph ph-clock" style="color: var(--text-muted); margin-right: 0.5rem;"></i> ' + assignment.shiftTime + '</td>\
                    <td style="text-align: right;">\
                        <button class="icon-btn" title="Solicitar Troca" onclick="openSwapModal(\'' + assignment.shiftId + '\', \'' + assignment.date + '\')">\
                            <i class="ph ph-arrows-left-right"></i>\
                        </button>\
                    </td>\
                </tr>\
        ';
    });
    html += '\
            </tbody>\
        </table>\
    ';
    container.innerHTML = html;
}
