function runLocalGenerationAlgorithm() {
    const days = getWorkingDays();
    const assignedToday = {};

    state.shifts.forEach(shift => {
        days.forEach(day => {
            state.schedule[`${shift.id}-${day}`] = [];
        });
    });

    state.shifts.forEach(shift => {
        days.forEach(day => {
            if (!assignedToday[day]) assignedToday[day] = [];

            let available = state.people.filter(person => {
                if (isPersonUnavailable(person, day)) return false;
                if (assignedToday[day].includes(person.id)) return false;
                if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) return false;
                return true;
            });

            available.sort((a, b) => {
                const countA = state.shiftCounts[a.id] || 0;
                const countB = state.shiftCounts[b.id] || 0;
                return countA - countB;
            });

            let needed = shift.capacity;
            for (let person of available) {
                if (needed <= 0) break;
                const totalShifts = Object.values(state.schedule).filter(arr => arr.includes(person.id)).length;
                if (totalShifts < person.maxShifts) {
                    state.schedule[`${shift.id}-${day}`].push(person.id);
                    assignedToday[day].push(person.id);
                    needed--;
                }
            }

            if (needed > 0) {
                const extraAvailable = available
                    .filter(person => !assignedToday[day].includes(person.id))
                    .sort((a, b) => {
                        const totalA = Object.values(state.schedule).filter(arr => arr.includes(a.id)).length;
                        const totalB = Object.values(state.schedule).filter(arr => arr.includes(b.id)).length;
                        const overA = Math.max(0, totalA - a.maxShifts + 1);
                        const overB = Math.max(0, totalB - b.maxShifts + 1);
                        if (overA !== overB) return overA - overB;
                        return (state.shiftCounts[a.id] || 0) - (state.shiftCounts[b.id] || 0);
                    });

                for (let person of extraAvailable) {
                    if (needed <= 0) break;
                    state.schedule[`${shift.id}-${day}`].push(person.id);
                    assignedToday[day].push(person.id);
                    needed--;
                }
            }
        });
    });
}
