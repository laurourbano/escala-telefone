function calculateDefaultEndDate(startDateStr) {
    let date = new Date(startDateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    let added = 0;
    while (added < 5) {
        const dow = date.getDay();
        if (dow !== 0 && dow !== 6) added++;
        if (added < 5) date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
}
