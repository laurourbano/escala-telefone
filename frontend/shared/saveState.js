function saveState() {
    localStorage.setItem('escala_people', JSON.stringify(state.people));
    localStorage.setItem('escala_shifts', JSON.stringify(state.shifts));
    localStorage.setItem('escala_schedule', JSON.stringify(state.schedule));
    localStorage.setItem('escala_config', JSON.stringify(state.config));
    localStorage.setItem('escala_start_date', state.scheduleStartDate);
    localStorage.setItem('escala_end_date', state.scheduleEndDate);
    localStorage.setItem('escala_closed_dates', JSON.stringify(state.closedDates));
    localStorage.setItem('escala_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('escala_last_schedule', JSON.stringify(state.lastSchedule));
    localStorage.setItem('escala_shift_counts', JSON.stringify(state.shiftCounts));

// Sincroniza com o servidor apenas se houver pendências de sincronização
if (state.needsSync && typeof saveScheduleToServer === 'function') {
    saveScheduleToServer().catch(() => {});
}
}
