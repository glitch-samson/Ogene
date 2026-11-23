import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, LockOpen, Search, SlidersHorizontal, Send, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { withAuthors, getAuthors } from '../lib/authors';
import { CATEGORIES } from '../lib/categories';
import AuthorNames from '../components/authors/AuthorNames';
import BrowseBySubject from '../components/article/BrowseBySubject';

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'views', label: 'Most viewed', needsViews: true },
    { value: 'title', label: 'Title A–Z' },
];
const PER_PAGE_OPTIONS = [10, 20, 50];

const fmtDate = (value) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const yearOf = (article) => String(new Date(article.created_at).getFullYear());

function matchesQuery(article, term) {
    if (!term) return true;
    const haystack = [
        article.title,
        article.description,
        article.category,
        ...getAuthors(article).map((a) => a.full_name),
        ...(article.keywords || []),
    ].filter(Boolean).join(' ').toLowerCase();
    return term.split(/\s+/).every((word) => haystack.includes(word));
}

function countBy(list, keyFn) {
    const counts = new Map();
    list.forEach((item) => {
        const key = keyFn(item);
        if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
}

// [1, '…', 4, 5, 6, '…', 12]
function pageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
        out.push(p);
    });
    return out;
}

function FilterGroup({ title, children }) {
    return (
        <details open className="group border-t border-navy-100 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ogene-900 [&::-webkit-details-marker]:hidden">
                {title}
                <ChevronDown size={16} className="text-ogene-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-3">{children}</div>
        </details>
    );
}

function FacetOption({ label, count, selected, onClick }) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                aria-pressed={selected}
                disabled={!count && !selected}
                className={`flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors disabled:cursor-default disabled:opacity-40 ${selected ? 'bg-navy-50 font-semibold text-navy-900' : 'text-navy-700 hover:bg-navy-50/70'}`}
            >
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-navy-700 bg-navy-700 text-white' : 'border-navy-300 bg-white'}`}>
                    {selected && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="flex-1">{label}</span>
                <span className="tabular-nums text-ogene-400">({count || 0})</span>
            </button>
        </li>
    );
}

function ResultCard({ article, open, onToggleAbstract }) {
    const views = typeof article.view_count === 'number' ? article.view_count : null;
    return (
        <li className="relative overflow-hidden rounded-lg border border-navy-100 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(10,21,48,0.05)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(10,21,48,0.08)]">
            <h3 className="text-lg font-medium leading-snug md:text-xl">
                <Link to={`/article/${article.id}`} className="group inline text-navy-800 hover:text-navy-900 hover:underline underline-offset-4">
                    {article.title}
                    <ChevronRight size={18} className="ml-1 inline-block align-[-3px] transition-transform group-hover:translate-x-0.5" />
                </Link>
            </h3>

            <div className="mt-2 text-sm">
                <AuthorNames
                    article={article}
                    variant="full"
                    className="text-ogene-500"
                    nameClassName="text-navy-600 underline-offset-4 hover:text-navy-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-400"
                />
            </div>

            {article.category && (
                <Link
                    to={`/articles?category=${encodeURIComponent(article.category)}`}
                    className="mt-2 inline-block text-sm text-navy-600 hover:text-navy-900 hover:underline underline-offset-4"
                >
                    {article.category}
                </Link>
            )}

            <p className="mt-2 text-sm text-ogene-500">
                Published online: {fmtDate(article.created_at)}
                {views != null && <> <span className="mx-1.5 text-ogene-300">|</span> Views: {views}</>}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {article.description && (
                    <button
                        type="button"
                        onClick={onToggleAbstract}
                        aria-expanded={open}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-navy-900"
                    >
                        Abstract
                        <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>
                )}
                <Link
                    to={`/article/${article.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-navy-700 px-3 py-1 text-sm font-semibold text-navy-800 transition-colors hover:bg-navy-800 hover:text-white"
                >
                    Full Text <ChevronRight size={14} />
                </Link>
            </div>

            {article.description && (
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden" inert={!open}>
                        <p className="mt-4 whitespace-pre-line border-l-2 border-gold-400 pl-4 text-[15px] leading-7 text-ogene-700">
                            {article.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Open-access corner */}
            <span
                title="Open access"
                aria-label="Open access"
                className="absolute bottom-0 right-0 h-10 w-10 bg-gold-400 text-navy-900 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
            >
                <LockOpen size={12} strokeWidth={2.5} className="absolute bottom-1.5 right-1.5" />
            </span>
        </li>
    );
}

export default function Articles() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openAbstracts, setOpenAbstracts] = useState(() => new Set());
    const [filtersOpen, setFiltersOpen] = useState(false);
    const resultsRef = useRef(null);

    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const year = searchParams.get('year') || '';
    const sort = searchParams.get('sort') || 'newest';
    const perPage = PER_PAGE_OPTIONS.includes(Number(searchParams.get('per'))) ? Number(searchParams.get('per')) : 10;
    const requestedPage = Math.max(1, Number(searchParams.get('page')) || 1);

    useEffect(() => {
        let cancelled = false;
        withAuthors((sel) =>
            supabase.from('articles').select(sel).eq('is_public', true).order('created_at', { ascending: false }),
        ).then(({ data, error }) => {
            if (cancelled) return;
            if (error) console.error('Error fetching articles:', error);
            setArticles(data || []);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    /** Change URL params; any filter change goes back to page 1. */
    const updateParams = (patch, { keepPage = false } = {}) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(patch).forEach(([k, v]) => {
                if (v === '' || v == null) next.delete(k);
                else next.set(k, String(v));
            });
            if (!keepPage) next.delete('page');
            return next;
        }, { replace: true });
    };

    const goToPage = (page) => {
        updateParams({ page: page > 1 ? page : '' }, { keepPage: true });
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const submitSearch = (e) => {
        e.preventDefault();
        updateParams({ q: new FormData(e.currentTarget).get('q').toString().trim() });
    };

    // Filtering + facet counts (each facet counts against the other filters).
    const term = q.toLowerCase().trim();
    const byQuery = articles.filter((a) => matchesQuery(a, term));
    const subjectCounts = countBy(byQuery.filter((a) => !year || yearOf(a) === year), (a) => a.category);
    const yearCounts = countBy(byQuery.filter((a) => !category || a.category === category), yearOf);
    const filtered = byQuery.filter((a) => (!category || a.category === category) && (!year || yearOf(a) === year));

    const hasViews = articles.some((a) => typeof a.view_count === 'number');
    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'title') return a.title.localeCompare(b.title);
        if (sort === 'views') return (b.view_count || 0) - (a.view_count || 0);
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const page = Math.min(requestedPage, totalPages);
    const pageItems = sorted.slice((page - 1) * perPage, page * perPage);
    const from = sorted.length ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, sorted.length);

    const subjects = [...new Set([...CATEGORIES, ...subjectCounts.keys()])];
    const years = [...yearCounts.keys()].sort((a, b) => b.localeCompare(a));
    const chips = [
        q && { key: 'q', label: `“${q}”` },
        category && { key: 'category', label: category },
        year && { key: 'year', label: year },
    ].filter(Boolean);

    const toggleAbstract = (id) =>
        setOpenAbstracts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const selectClass = 'h-9 rounded-md border border-navy-200 bg-white px-2.5 text-sm text-ogene-700 focus:outline-none focus:ring-2 focus:ring-navy-200';

    return (
        <div className="bg-white">
            {/* Breadcrumb strip */}
            <div className="bg-navy-800 text-[13px] text-white">
                <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto flex items-center gap-1.5 px-4 py-1.5 sm:px-6 lg:px-8">
                    <Link to="/" className="text-navy-100 hover:text-white hover:underline">Home</Link>
                    <ChevronRight size={12} className="text-navy-300" />
                    {category ? (
                        <>
                            <button type="button" onClick={() => updateParams({ category: '' })} className="text-navy-100 hover:text-white hover:underline">Articles</button>
                            <ChevronRight size={12} className="text-navy-300" />
                            <span className="font-semibold" aria-current="page">{category}</span>
                        </>
                    ) : (
                        <span className="font-semibold" aria-current="page">Articles</span>
                    )}
                </nav>
            </div>

            {/* Banner */}
            <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
                <section className="relative overflow-hidden rounded-lg bg-navy-900 px-6 py-10 text-white sm:px-12 md:py-14">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-gold-400/15 blur-3xl" />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-40 md:block"
                        style={{
                            backgroundImage: 'radial-gradient(var(--color-navy-400) 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                            maskImage: 'linear-gradient(to left, black, transparent)',
                            WebkitMaskImage: 'linear-gradient(to left, black, transparent)',
                        }}
                    />
                    <div className="relative max-w-xl">
                        <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">{category || 'All Articles'}</h1>
                        <p className="mt-3 leading-relaxed text-navy-100">
                            {category
                                ? `Peer-reviewed, open-access research in ${category} from OGENE Journal.`
                                : 'Explore peer-reviewed, open-access research published in OGENE Journal, across every subject.'}
                        </p>
                        <form role="search" onSubmit={submitSearch} className="mt-6 flex gap-2">
                            <label htmlFor="articles-search" className="sr-only">Search articles</label>
                            <input
                                key={q}
                                id="articles-search"
                                name="q"
                                type="search"
                                defaultValue={q}
                                placeholder={category ? 'Search this subject by keyword' : 'Search by keyword, author or title'}
                                className="h-11 min-w-0 flex-1 rounded-md bg-white px-4 text-ogene-900 placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
                            />
                            <button type="submit" aria-label="Search" className="flex h-11 w-12 items-center justify-center rounded-md bg-gold-400 text-navy-900 transition-colors hover:bg-gold-300">
                                <Search size={18} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>
                </section>
            </div>

            <div className="max-w-7xl mx-auto grid gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
                {/* ── Sidebar ── */}
                <aside>
                    <div className="rounded-lg bg-navy-50 p-5">
                        <h2 className="font-serif text-lg font-bold text-navy-900">Looking to submit?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-ogene-600">
                            Share your research with OGENE Journal. Read the <Link to="/guidelines" className="font-semibold text-navy-700 hover:underline">author guidelines</Link>, then send us your manuscript.
                        </p>
                        <Link to="/submit" className="mt-4 inline-flex items-center gap-2 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-900">
                            <Send size={14} /> Submit a manuscript
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFiltersOpen((o) => !o)}
                        aria-expanded={filtersOpen}
                        className="mt-6 flex w-full items-center justify-between rounded-md border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 lg:hidden"
                    >
                        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} /> Filters{chips.length ? ` (${chips.length})` : ''}</span>
                        <ChevronDown size={16} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
                        <h2 className="mt-8 text-xl font-semibold text-ogene-900">Filters</h2>

                        {chips.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-ogene-700">Selected filters</p>
                                <ul className="mt-2 flex flex-wrap gap-2">
                                    {chips.map((c) => (
                                        <li key={c.key}>
                                            <button
                                                type="button"
                                                onClick={() => updateParams({ [c.key]: '' })}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-navy-800"
                                                aria-label={`Remove filter ${c.label}`}
                                            >
                                                {c.label} <X size={13} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {chips.length > 1 && (
                                    <button type="button" onClick={() => updateParams({ q: '', category: '', year: '' })} className="mt-2 text-xs font-semibold text-navy-700 hover:underline">
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mt-5">
                            <FilterGroup title="Subjects">
                                <ul className="space-y-0.5">
                                    {subjects.map((s) => (
                                        <FacetOption
                                            key={s}
                                            label={s}
                                            count={subjectCounts.get(s)}
                                            selected={category === s}
                                            onClick={() => updateParams({ category: category === s ? '' : s })}
                                        />
                                    ))}
                                </ul>
                            </FilterGroup>

                            <FilterGroup title="Publication year">
                                {years.length === 0 ? (
                                    <p className="px-2 text-sm text-ogene-400">No years to show.</p>
                                ) : (
                                    <ul className="space-y-0.5">
                                        {years.map((y) => (
                                            <FacetOption
                                                key={y}
                                                label={y}
                                                count={yearCounts.get(y)}
                                                selected={year === y}
                                                onClick={() => updateParams({ year: year === y ? '' : y })}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </FilterGroup>
                        </div>

                        <div className="border-t border-navy-100 pt-5">
                            <h2 className="font-semibold text-ogene-900">Modify your search</h2>
                            <form role="search" onSubmit={submitSearch} className="mt-3 space-y-2">
                                <label htmlFor="sidebar-search" className="sr-only">Search term</label>
                                <input
                                    key={q}
                                    id="sidebar-search"
                                    name="q"
                                    type="search"
                                    defaultValue={q}
                                    placeholder="Enter search term"
                                    className="h-10 w-full rounded-md border border-navy-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
                                />
                                <button type="submit" className="h-9 rounded-md bg-navy-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-900">
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* ── Results ── */}
                <section ref={resultsRef} aria-label="Search results" className="min-w-0 scroll-mt-24">
                    <p className="text-sm text-ogene-600">
                        {loading ? 'Loading articles…' : (
                            <>
                                <span className="font-semibold text-ogene-900">
                                    Showing {from}–{to} of {sorted.length} result{sorted.length === 1 ? '' : 's'}
                                </span>
                                {(q || category || year) && (
                                    <> for {[q && `“${q}”`, category, year].filter(Boolean).join(' · ')}</>
                                )}
                            </>
                        )}
                    </p>

                    <div className="mt-4 rounded-lg bg-ogene-100/70 p-3 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-lg">
                            <span className="relative rounded-md bg-navy-800 px-5 py-2 text-center text-sm font-semibold text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-x-[7px] after:border-t-[7px] after:border-x-transparent after:border-t-navy-800 after:content-['']">
                                Articles <span className="ml-1 font-normal tabular-nums text-navy-200">{loading ? '…' : sorted.length}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="sr-only" htmlFor="sort">Sort by</label>
                                <select id="sort" value={sort} onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })} className={selectClass}>
                                    {SORTS.filter((s) => !s.needsViews || hasViews).map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <label className="sr-only" htmlFor="per-page">Results per page</label>
                                <select id="per-page" value={perPage} onChange={(e) => updateParams({ per: e.target.value === '10' ? '' : e.target.value })} className={selectClass}>
                                    {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} per page</option>)}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <ul className="mt-5 space-y-4" aria-hidden="true">
                                {[0, 1, 2].map((i) => (
                                    <li key={i} className="space-y-3 rounded-lg bg-white p-6">
                                        <div className="h-5 w-3/4 animate-pulse rounded bg-navy-50" />
                                        <div className="h-3 w-1/3 animate-pulse rounded bg-navy-50" />
                                        <div className="h-3 w-1/4 animate-pulse rounded bg-navy-50" />
                                    </li>
                                ))}
                            </ul>
                        ) : pageItems.length === 0 ? (
                            <div className="mt-5 rounded-lg bg-white px-6 py-14 text-center">
                                <p className="font-serif text-xl font-bold text-navy-900">No articles match your search</p>
                                <p className="mt-2 text-sm text-ogene-500">Try different keywords or remove a filter.</p>
                                <button type="button" onClick={() => updateParams({ q: '', category: '', year: '' })} className="mt-5 text-sm font-semibold text-navy-700 hover:underline">
                                    Clear search and filters
                                </button>
                            </div>
                        ) : (
                            <ul className="mt-5 space-y-4">
                                {pageItems.map((a) => (
                                    <ResultCard key={a.id} article={a} open={openAbstracts.has(a.id)} onToggleAbstract={() => toggleAbstract(a.id)} />
                                ))}
                            </ul>
                        )}

                        {!loading && totalPages > 1 && (
                            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1">
                                <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-white disabled:opacity-30">
                                    <ChevronLeft size={18} />
                                </button>
                                {pageList(page, totalPages).map((p, i) =>
                                    p === '…' ? (
                                        <span key={`gap-${i}`} className="px-1 text-ogene-400">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => goToPage(p)}
                                            aria-current={p === page ? 'page' : undefined}
                                            className={`h-9 min-w-9 rounded-md px-2 text-sm font-semibold tabular-nums transition-colors ${p === page ? 'bg-navy-800 text-white' : 'text-navy-700 hover:bg-white'}`}
                                        >
                                            {p}
                                        </button>
                                    ),
                                )}
                                <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-white disabled:opacity-30">
                                    <ChevronRight size={18} />
                                </button>
                            </nav>
                        )}
                    </div>
                </section>
            </div>

            <BrowseBySubject />
        </div>
    );
}
