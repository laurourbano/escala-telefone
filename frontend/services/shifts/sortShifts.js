function sortShifts() {
    state.shifts.sort((shiftA, shiftB) => {
        const timeA = (shiftA.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        const timeB = (shiftB.time.match(/\d{2}:\d{2}/) || ['24:00'])[0];
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return shiftA.name.localeCompare(shiftB.name);
    });
}
