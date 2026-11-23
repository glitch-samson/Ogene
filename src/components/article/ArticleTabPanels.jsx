import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Mail, ExternalLink } from 'lucide-react';
import { buildCitations, JOURNAL_NAME } from '../../lib/citation';
import { findDoi, scholarUrl } from '../../lib/references';
import { SITE } from '../../lib/site';

// Contact for reuse requests.
const EDITORIAL_EMAIL = SITE.email;

const panelHeading = 'font-serif text-2xl font-bold text-navy-900';
const linkClass = 'px-4 text-navy-700 transition-colors hover:text-navy-900 hover:underline underline-offset-4';

export function ReferencesPanel({ references }) {
    return (
        <>
            <h2 className={panelHeading}>References</h2>
            {references.length === 0 ? (
                <p className="mt-4 leading-7 text-ogene-600">
                    No reference list has been added for this article yet. The full references appear in the article PDF below.
                </p>
            ) : (
                <ol className="mt-6 space-y-7">
                    {references.map((ref, i) => {
                        const doi = findDoi(ref);
                        return (
                            <li key={`${i}-${ref.slice(0, 24)}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
                                <span className="text-right font-semibold text-navy-900 tabular-nums">{i + 1}.</span>
                                <div>
                                    <p className="break-words text-[15px] leading-7 text-ogene-700">{ref}</p>
                                    <div className="mt-2.5 ml-6 inline-flex divide-x divide-navy-100 border-l border-navy-100 text-sm">
                                        {doi && (
                                            <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                                DOI
                                            </a>
                                        )}
                                        <a href={scholarUrl(ref)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                            Google Scholar
                                        </a>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </>
    );
}

const STYLES = [
    { key: 'apa', label: 'APA' },
    { key: 'mla', label: 'MLA' },
    { key: 'chicago', label: 'Chicago' },
    { key: 'bibtex', label: 'BibTeX' },
];

const fmtDate = (value) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Citation style switcher + formatted citation + copy button. Used both in the
 * Citations tab and in the "Cite this article" pop-up.
 */
export function CitationTool({ title, authors, published, url }) {
    const [style, setStyle] = useState('apa');
    const [copied, setCopied] = useState(false);
    const text = buildCitations({ title, authors, published, url })[style];

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <>
            <div role="tablist" aria-label="Citation style" className="inline-flex gap-1 rounded-lg bg-navy-50 p-1">
                {STYLES.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        role="tab"
                        aria-selected={style === s.key}
                        onClick={() => { setStyle(s.key); setCopied(false); }}
                        className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${style === s.key ? 'bg-white text-navy-800 shadow-sm' : 'text-ogene-500 hover:text-navy-800'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <pre className={`mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-navy-100 bg-ogene-50 p-5 leading-relaxed text-ogene-800 ${style === 'bibtex' ? 'font-mono text-xs' : 'font-serif text-[15px]'}`}>
                {text}
            </pre>

            <button
                type="button"
                onClick={copy}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy citation'}
            </button>
        </>
    );
}

/**
 * citedBy: OGENE articles whose reference list mentions this one
 * (article_cited_by()), or null while loading.
 */
export function CitationsPanel({ title, authors, published, url, citedBy }) {
    const scholarSearch = `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${title}"`)}`;

    return (
        <>
            <h2 className={panelHeading}>Citations</h2>

            {/* ── Cited by ── */}
            <section className="mt-6" aria-labelledby="cited-by-heading">
                <h3 id="cited-by-heading" className="flex items-center gap-2.5 font-semibold text-ogene-900">
                    Cited by
                    {citedBy && (
                        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-bold tabular-nums text-navy-800">
                            {citedBy.length}
                        </span>
                    )}
                </h3>

                {citedBy === null ? (
                    <p className="mt-3 text-sm text-ogene-500">Checking for citations…</p>
                ) : citedBy.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-7 text-center">
                        <p className="font-serif text-lg font-bold text-navy-900">Not cited yet</p>
                        <p className="mt-1 text-sm text-ogene-500">No articles in {JOURNAL_NAME} cite this article yet.</p>
                    </div>
                ) : (
                    <ul className="mt-3 divide-y divide-navy-100 rounded-xl border border-navy-100">
                        {citedBy.map((c) => (
                            <li key={c.id}>
                                <Link to={`/article/${c.id}`} className="group block px-5 py-4 transition-colors hover:bg-navy-50/60">
                                    <p className="font-medium leading-snug text-navy-800 group-hover:underline underline-offset-4">{c.title}</p>
                                    <p className="mt-1 text-xs text-ogene-500">
                                        {c.author_name ? `${c.author_name} · ` : ''}Published {fmtDate(c.created_at)}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <a
                    href={scholarSearch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-navy-700 transition-colors hover:text-navy-900 hover:underline underline-offset-4"
                >
                    <ExternalLink size={14} /> Look for citations outside {JOURNAL_NAME} on Google Scholar
                </a>
            </section>

            <hr className="my-9 border-navy-100" />

            {/* ── Cite this article ── */}
            <h3 className="font-semibold text-ogene-900">Cite this article</h3>
            <p className="mt-1 mb-5 text-sm text-ogene-500">Choose a citation style, then copy it into your reference list.</p>
            <CitationTool title={title} authors={authors} published={published} url={url} />
        </>
    );
}

export function PermissionsPanel({ title }) {
    const subject = encodeURIComponent(`Permission request: ${title}`);
    return (
        <>
            <h2 className={panelHeading}>Reprints and Permissions</h2>
            <div className="mt-4 space-y-3 leading-7 text-ogene-700">
                <p>This is an open access article: anyone can read it online, free of charge, in {JOURNAL_NAME}.</p>
                <p>
                    You may quote short passages with a full citation of the article. To reprint, translate, republish or
                    otherwise reuse all or part of this article, please request permission from the {JOURNAL_NAME} editorial office.
                </p>
            </div>
            <a
                href={`mailto:${EDITORIAL_EMAIL}?subject=${subject}`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
            >
                <Mail size={16} /> Request permission
            </a>
            <p className="mt-2 text-xs text-ogene-500">{EDITORIAL_EMAIL}</p>
        </>
    );
}
