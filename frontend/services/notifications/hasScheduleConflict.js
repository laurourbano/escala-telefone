function hasScheduleConflict(personId, date, allowedShiftId) {
    return state.shifts.some(shift => {
        if (shift.id === allowedShiftId) return false;
        const peopleInShift = state.schedule[`${shift.id}-${date}`] || [];
        return peopleInShift.includes(personId);
    });
}

if (typeof module !== 'undefined') {
    module.exports = { hasScheduleConflict };
}
