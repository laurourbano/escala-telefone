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

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            const seen = new Set();
            state.schedule[key] = assigned.filter(personId => {
                if (seen.has(personId)) {
                    removed++;
                    return false;
                }
                seen.add(personId);
                return true;
            });
        });
    });

    const personTotalCount = {};
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            (state.schedule[key] || []).forEach(personId => {
                personTotalCount[personId] = (personTotalCount[personId] || 0) + 1;
            });
        });
    });
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            state.schedule[key] = assigned.filter(personId => {
                const person = state.people.find(p => p.id === personId);
                if (person && personTotalCount[personId] > person.maxShifts) {
                    personTotalCount[personId]--;
                    removed++;
                    return false;
                }
                return true;
            });
        });
    });

    return removed;
}
