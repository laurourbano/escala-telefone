function removeClosedDate(date) {
    state.closedDates = state.closedDates.filter(function (closedDate) { return closedDate !== date; });
    saveState();
    renderClosedDates();
    renderScheduleBoard();
}
