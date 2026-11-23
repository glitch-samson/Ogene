// Reference lists are entered as plain text, one reference per line.

/** Textarea text → array of references, dropping leading "1." / "[1]" numbering. */
export function parseReferences(text) {
    if (!text) return null;
    const list = text
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^(\[\d+\]|\d+[.)])\s+/, ''))
        .filter(Boolean);
    return list.length ? list : null;
}

/** Array → textarea text. */
export function referencesToText(list) {
    return (list || []).join('\n');
}

const DOI_PATTERN = /\b(10\.\d{4,9}\/[^\s"<>]+)/i;

/** The DOI inside a reference, if it has one (without a trailing full stop). */
export function findDoi(reference) {
    const match = reference.match(DOI_PATTERN);
    return match ? match[1].replace(/[.,;]+$/, '') : null;
}

export function scholarUrl(reference) {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(reference.slice(0, 300))}`;
}
