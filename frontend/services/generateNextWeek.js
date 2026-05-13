function generateNextWeek() {
    if (!confirm('Avançar para a próxima semana e gerar uma nova escala? A escala atual será substituída.')) return;

    const advanceDate = (dateStr, days) => {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    state.scheduleStartDate = advanceDate(state.scheduleStartDate, 7);
    state.scheduleEndDate = advanceDate(state.scheduleEndDate, 7);
    document.getElementById('schedule-start-date').value = state.scheduleStartDate;
    document.getElementById('schedule-end-date').value = state.scheduleEndDate;
    generateSchedule(true);
}
