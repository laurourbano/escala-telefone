function cleanScheduleConflicts() {
    const days = getWorkingDays();
    let removed = 0;

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            state.schedule[key] = assigned.filter(personId => {
                const person = state.people.find(p => p.id === personId);
                if (!person || isPersonUnavailable(person, day)) {
                    removed++;
                    return false;
                }
                return true;
            });
        });
    });

    var dayAssignments = {};
    days.forEach(function (day) { dayAssignments[day] = new Set(); });
    state.shifts.forEach(function (shift) {
        days.forEach(function (day) {
            var key = shift.id + '-' + day;
            var assigned = state.schedule[key] || [];
            state.schedule[key] = assigned.filter(function (personId) {
                if (dayAssignments[day].has(personId)) {
                    removed++;
                    return false;
                }
                dayAssignments[day].add(personId);
                return true;
            });
        });
    });

    return removed;
}
