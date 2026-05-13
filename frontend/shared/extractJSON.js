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
