import { supabase } from './supabase';

// Embed for an article's ordered author list. Add to any articles select.
export const AUTHORS_SELECT =
    'article_authors(position, is_corresponding, contributions, authors(id, full_name, avatar_url, profile_id))';

/**
 * Runs a query with the author list embedded, falling back to a plain query if
 * the database doesn't have the author tables yet (migration not run), so the
 * site keeps working on typed author names in the meantime.
 *
 *   const { data, error } = await withAuthors((sel) =>
 *       supabase.from('articles').select(sel).eq('is_public', true));
 *
 * `sel` is `*, article_authors(...)`; for nested selects pass it through,
 * e.g. `supabase.from('library').select(\`*, articles(${sel})\`)`.
 */
export async function withAuthors(run) {
    const result = await run(`*, ${AUTHORS_SELECT}`);
    const msg = result.error?.message || '';
    if (result.error && (result.error.code === 'PGRST200' || msg.includes('article_authors'))) {
        return run('*');
    }
    return result;
}

/** Ordered [{ id, full_name, avatar_url, is_corresponding }] for an article. */
export function getAuthors(article) {
    const rows = article?.article_authors;
    if (Array.isArray(rows) && rows.length > 0) {
        return [...rows]
            .sort((a, b) => a.position - b.position)
            .filter((r) => r.authors)
            .map((r) => ({ ...r.authors, is_corresponding: r.is_corresponding, contributions: r.contributions || [] }));
    }
    const name = article?.author_name?.trim() || article?.profiles?.full_name?.trim();
    return name ? [{ id: null, full_name: name }] : [];
}

/** "A" · "A & B" · "A et al." */
export function formatAuthorsShort(authors, fallback = 'Unknown Author') {
    if (!authors.length) return fallback;
    if (authors.length === 1) return authors[0].full_name;
    if (authors.length === 2) return `${authors[0].full_name} & ${authors[1].full_name}`;
    return `${authors[0].full_name} et al.`;
}

/** "A, B & C" */
export function formatAuthorsFull(authors, fallback = 'Unknown Author') {
    if (!authors.length) return fallback;
    if (authors.length === 1) return authors[0].full_name;
    const names = authors.map((a) => a.full_name);
    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

// author_card results are cached per (author, article) for the page's lifetime.
const cardCache = new Map();

export function fetchAuthorCard(authorId, articleId = null) {
    const key = `${authorId}:${articleId || ''}`;
    if (!cardCache.has(key)) {
        const promise = supabase
            .rpc('author_card', { p_author_id: authorId, p_article_id: articleId })
            .then(({ data, error }) => {
                if (error) throw error;
                return data;
            })
            .catch((err) => {
                cardCache.delete(key); // allow a retry on the next open
                throw err;
            });
        cardCache.set(key, promise);
    }
    return cardCache.get(key);
}

export function clearAuthorCardCache() {
    cardCache.clear();
}

export function orcidUrl(orcid) {
    if (!orcid) return null;
    const id = orcid.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, '');
    return `https://orcid.org/${id}`;
}

export function externalUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** "a, b; c" → ['a', 'b', 'c'] (manuscript keywords are free text). */
export function parseKeywords(text) {
    if (!text) return null;
    const list = text.split(/\s*[,;]\s*/).map((k) => k.trim()).filter(Boolean);
    return list.length ? list : null;
}

export function initials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}
