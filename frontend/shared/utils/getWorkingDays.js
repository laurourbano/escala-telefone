function getWorkingDays() {
    const days = [];
    if (!state.scheduleStartDate || !state.scheduleEndDate) return days;
    let current = new Date(state.scheduleStartDate + 'T00:00:00');
    const end = new Date(state.scheduleEndDate + 'T00:00:00');
    if (isNaN(current.getTime()) || isNaN(end.getTime())) return days;
    if (current > end) return days;
    let iterations = 0;
    while (current <= end && iterations < 62) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !state.closedDates.includes(dateStr)) {
            days.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
        iterations++;
    }
    return days;
}
