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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { toTitleCase, getFirstName, generateEmail, formatDate, calculateDefaultEndDate };
}
