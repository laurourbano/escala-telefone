function toTitleCase(text) {
    if (!text) return '';
    return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getFirstName(name) {
    if (!name) return '';
    return name.split(' ')[0];
}

function generateEmail(name) {
    if (!name) return '';
    const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const parts = normalized.split(/\s+/);
    if (parts.length > 1) {
        return `${parts[0]}.${parts[parts.length - 1]}@crf-pr.org.br`;
    }
    return `${parts[0]}@crf-pr.org.br`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} (${days[date.getDay()]})`;
}

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

function isPersonUnavailable(person, dateStr) {
    if (person.status === 'disponivel') return false;
    if (person.unavailabilityStart && person.unavailabilityEnd) {
        return dateStr >= person.unavailabilityStart && dateStr <= person.unavailabilityEnd;
    } else if (person.unavailabilityStart) {
        return dateStr >= person.unavailabilityStart;
    } else if (person.unavailabilityEnd) {
        return dateStr <= person.unavailabilityEnd;
    }
    return true;
}

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { toTitleCase, getFirstName, generateEmail, formatDate, calculateDefaultEndDate, isPersonUnavailable, getWorkingDays, extractJSON };
}

function extractJSON(text) {
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return codeBlock[1].trim();
    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (escaped) { escaped = false; continue; }
        if (char === '\\' && inString) { escaped = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (char === '{') depth++;
        else if (char === '}') {
            depth--;
            if (depth === 0) return text.substring(start, i + 1);
        }
    }
    return null;
}
