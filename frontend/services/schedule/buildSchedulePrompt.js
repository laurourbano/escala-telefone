function buildSchedulePrompt() {
    const days = getWorkingDays();
    const peopleData = state.people.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        unavailabilityStart: p.unavailabilityStart || null,
        unavailabilityEnd: p.unavailabilityEnd || null,
        maxShifts: p.maxShifts,
        preferredShifts: p.preferredShifts
    }));

    const shiftsData = state.shifts.map(s => ({
        id: s.id,
        name: s.name,
        time: s.time,
        capacity: s.capacity
    }));

    const lastWeekPersonShifts = {};
    Object.entries(state.lastSchedule).forEach(([key, personIds]) => {
        personIds.forEach(personId => {
            lastWeekPersonShifts[personId] = (lastWeekPersonShifts[personId] || 0) + 1;
        });
    });

    return {
        days,
        people: peopleData,
        shifts: shiftsData,
        closedDates: state.closedDates,
        lastWeekAssignments: state.lastSchedule,
        lastWeekPersonShifts,
        shiftCounts: state.shiftCounts,
        rules: {
            noWeekends: true,
            respectCapacity: true,
            respectMaxShifts: true,
            respectUnavailability: true,
            preferPreferredShifts: true,
            balanceDistribution: true,
            noDuplicatesPerDay: true
        }
    };
}
