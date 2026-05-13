function generateEmail(name) {
    if (!name) return '';
    const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const parts = normalized.split(/\s+/);
    if (parts.length > 1) {
        return `${parts[0]}.${parts[parts.length - 1]}@crf-pr.org.br`;
    }
    return `${parts[0]}@crf-pr.org.br`;
}
