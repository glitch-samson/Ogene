export const JOURNAL_NAME = 'OGENE Journal';

function splitName(full) {
    const parts = full.trim().split(/\s+/);
    const last = parts.pop() || '';
    return { last, given: parts };
}

const initialsOf = (given) => given.map((g) => `${g[0].toUpperCase()}.`).join(' ');

function apaAuthors(names) {
    const list = names.map((n) => {
        const { last, given } = splitName(n);
        return given.length ? `${last}, ${initialsOf(given)}` : last;
    });
    if (list.length <= 1) return list[0] || '';
    if (list.length === 2) return `${list[0]}, & ${list[1]}`;
    return `${list.slice(0, -1).join(', ')}, & ${list[list.length - 1]}`;
}

function invertedName(n) {
    const { last, given } = splitName(n);
    return given.length ? `${last}, ${given.join(' ')}` : last;
}

function mlaAuthors(names) {
    if (names.length === 0) return '';
    if (names.length === 1) return invertedName(names[0]);
    if (names.length === 2) return `${invertedName(names[0])}, and ${names[1]}`;
    return `${invertedName(names[0])}, et al`;
}

function chicagoAuthors(names) {
    if (names.length === 0) return '';
    if (names.length === 1) return invertedName(names[0]);
    const rest = names.slice(1);
    if (rest.length === 1) return `${invertedName(names[0])}, and ${rest[0]}`;
    return `${invertedName(names[0])}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`;
}

const endWithPeriod = (s) => (/[.?!]$/.test(s) ? s : `${s}.`);

/**
 * @param {{ title: string, authors: string[], published: Date, url: string }} input
 * @returns {{ apa: string, mla: string, chicago: string, bibtex: string }}
 */
export function buildCitations({ title, authors, published, url }) {
    const year = published.getFullYear();
    const mlaDate = published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const apa = `${endWithPeriod(apaAuthors(authors))} (${year}). ${endWithPeriod(title)} ${JOURNAL_NAME}. ${url}`;
    const mla = `${endWithPeriod(mlaAuthors(authors))} "${endWithPeriod(title)}" ${JOURNAL_NAME}, ${mlaDate}, ${url}.`;
    const chicago = `${endWithPeriod(chicagoAuthors(authors))} ${year}. "${endWithPeriod(title)}" ${JOURNAL_NAME}. ${url}.`;

    const firstLast = authors[0] ? splitName(authors[0]).last : 'ogene';
    const firstWord = (title.match(/[A-Za-z0-9]+/) || ['article'])[0];
    const key = `${firstLast}${year}${firstWord}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bibtex = [
        `@article{${key},`,
        `  title   = {${title}},`,
        `  author  = {${authors.map(invertedName).join(' and ')}},`,
        `  journal = {${JOURNAL_NAME}},`,
        `  year    = {${year}},`,
        `  url     = {${url}}`,
        '}',
    ].join('\n');

    return { apa, mla, chicago, bibtex };
}
