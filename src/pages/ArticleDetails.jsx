import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LibraryBig, Heart, ChevronRight, FileText, LockOpen, Quote, Maximize2, Send, BookOpen, BookMarked, Printer, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import AuthorNames from '../components/authors/AuthorNames';
import ShareMenu from '../components/article/ShareMenu';
import { ReferencesPanel, CitationsPanel, PermissionsPanel } from '../components/article/ArticleTabPanels';
import { withAuthors, getAuthors, formatAuthorsShort } from '../lib/authors';
import { loadArticlePdf } from '../lib/articlePdf';
import BrowseBySubject from '../components/article/BrowseBySubject';

// react-pdf is heavy; only load it when an article page actually renders.
const PdfViewer = lazy(() => import('../components/reader/PdfViewer'));

const fmtDate = (value) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const INFO_TABS = [
    { id: 'references', label: 'References', icon: BookMarked },
    { id: 'citations', label: 'Citations', icon: Quote },
    { id: 'permissions', label: 'Reprints & Permissions', icon: Printer },
];

// In-page links glide to their section instead of jumping.
const scrollToSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function Stat({ value, label }) {
    return (
        <div className="border-b border-navy-100 pb-4 last:border-0">
            <p className="text-3xl font-light text-navy-900 tabular-nums">{value}</p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-ogene-500">{label}</p>
        </div>
    );
}

function OpenAccessBadge({ size = 'md', onClick }) {
    const dims = size === 'sm' ? 'h-6 w-6' : 'h-11 w-11';
    const icon = size === 'sm' ? 12 : 19;
    const Tag = onClick ? 'button' : 'span';
    return (
        <Tag
            {...(onClick ? { type: 'button', onClick } : {})}
            title="Open access — free to read"
            aria-label="Open access — free to read"
            className={`group/oa relative inline-flex ${dims} shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-900 shadow-sm ring-4 ring-gold-100 transition-transform duration-200 ${onClick ? 'hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500' : ''}`}
        >
            <LockOpen size={icon} strokeWidth={2.4} />
        </Tag>
    );
}

export default function ArticleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { success, error: showAlertError } = useAlert();

    const [article, setArticle] = useState(null);
    const [status, setStatus] = useState('loading');
    const [timeline, setTimeline] = useState(null);
    const [views, setViews] = useState(null);
    const [related, setRelated] = useState([]);
    const [citedBy, setCitedBy] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfStatus, setPdfStatus] = useState('loading');
    const [isFavourite, setIsFavourite] = useState(false);
    const [isInLibrary, setIsInLibrary] = useState(false);
    // Open info tab, plus the last one shown so its content stays put while
    // the panel animates closed.
    const [activeTab, setActiveTab] = useState(null);
    const [shownTab, setShownTab] = useState('references');
    const [activeSection, setActiveSection] = useState('abstract');
    const pdfUrlRef = useRef(null);

    // Article, then everything that hangs off it.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data: art, error } = await withAuthors((sel) =>
                supabase.from('articles').select(sel).eq('id', id).single(),
            );
            if (cancelled) return;
            if (error || !art) {
                setStatus('notfound');
                return;
            }
            setArticle(art);
            setViews(art.view_count ?? null);
            setStatus('ready');

            // Dates from the manuscript history (pipeline articles only).
            supabase.rpc('article_timeline', { p_article_id: id }).then(({ data }) => {
                if (!cancelled && Array.isArray(data) && data[0]) setTimeline(data[0]);
            });

            // OGENE articles that cite this one. Without the database function
            // (migration not run yet) there's nothing to report: treat as none.
            supabase.rpc('article_cited_by', { p_article_id: id }).then(({ data, error: citeError }) => {
                if (!cancelled) setCitedBy(citeError ? [] : data || []);
            });

            // One view per browser session. The flag is set before the call so
            // React's dev double-invoke doesn't count twice.
            const viewKey = `ogene:viewed:${id}`;
            let alreadyCounted = false;
            try {
                alreadyCounted = sessionStorage.getItem(viewKey) === '1';
                sessionStorage.setItem(viewKey, '1');
            } catch {
                // storage unavailable (private mode) — count anyway
            }
            if (!alreadyCounted) {
                supabase.rpc('record_article_view', { p_article_id: id }).then(({ data, error: viewError }) => {
                    if (!cancelled && !viewError && typeof data === 'number') setViews(data);
                });
            }

            // Related research: same subject, newest first.
            withAuthors((sel) => {
                let q = supabase.from('articles').select(sel).eq('is_public', true).neq('id', id);
                if (art.category) q = q.eq('category', art.category);
                return q.order('created_at', { ascending: false }).limit(5);
            }).then(({ data }) => {
                if (!cancelled) setRelated(data || []);
            });

            // The PDF itself, as a view-only blob.
            if (!art.file_path) {
                setPdfStatus('missing');
                return;
            }
            try {
                const url = await loadArticlePdf(art.file_path);
                if (cancelled) {
                    URL.revokeObjectURL(url);
                    return;
                }
                pdfUrlRef.current = url;
                setPdfUrl(url);
                setPdfStatus('ready');
            } catch (err) {
                console.error('Error loading article PDF:', err);
                if (!cancelled) setPdfStatus('error');
            }
        })();

        return () => {
            cancelled = true;
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
                pdfUrlRef.current = null;
            }
        };
    }, [id]);

    // Saved state for signed-in readers.
    useEffect(() => {
        if (!user) return undefined;
        let cancelled = false;
        Promise.all([
            supabase.from('favourites').select('id').eq('user_id', user.id).eq('article_id', id).maybeSingle(),
            supabase.from('library').select('id').eq('user_id', user.id).eq('article_id', id).maybeSingle(),
        ]).then(([fav, lib]) => {
            if (cancelled) return;
            setIsFavourite(!!fav.data);
            setIsInLibrary(!!lib.data);
        });
        return () => { cancelled = true; };
    }, [id, user]);

    const keywords = (article?.keywords || []).filter(Boolean);
    const sections = [
        { id: 'abstract', label: 'Abstract' },
        keywords.length > 0 && { id: 'keywords', label: 'Keywords' },
        { id: 'article-pdf', label: 'Article PDF' },
        related.length > 0 && { id: 'related', label: 'Related research' },
    ].filter(Boolean);
    const sectionKey = sections.map((s) => s.id).join(',');

    // Highlight the section being read in the "On this page" menu. Only the
    // main column is tracked: "Related research" sits in the sidebar alongside
    // everything else, so it would always look like the topmost section.
    useEffect(() => {
        if (status !== 'ready') return undefined;
        const els = sectionKey
            .split(',')
            .filter((sid) => sid !== 'related')
            .map((sid) => document.getElementById(sid))
            .filter(Boolean);
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveSection(visible[0].target.id);
            },
            { rootMargin: '-120px 0px -55% 0px' },
        );
        els.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [status, sectionKey]);

    const toggleTab = (tabId) => {
        setShownTab(tabId);
        setActiveTab((current) => (current === tabId ? null : tabId));
    };

    const openTabAndReveal = (tabId) => {
        setShownTab(tabId);
        setActiveTab(tabId);
        setTimeout(() => {
            document.getElementById('article-info-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    };

    const toggleFavourite = async () => {
        if (!user) return navigate('/login');
        try {
            if (isFavourite) {
                await supabase.from('favourites').delete().eq('user_id', user.id).eq('article_id', id);
                setIsFavourite(false);
                success('Removed from favourites', 'Favourites');
            } else {
                await supabase.from('favourites').insert([{ user_id: user.id, article_id: id }]);
                setIsFavourite(true);
                success('Added to favourites', 'Favourites');
            }
        } catch {
            showAlertError('Failed to update favourites');
        }
    };

    const toggleLibrary = async () => {
        if (!user) return navigate('/login');
        try {
            if (isInLibrary) {
                await supabase.from('library').delete().eq('user_id', user.id).eq('article_id', id);
                setIsInLibrary(false);
                success('Removed from your library', 'Library');
            } else {
                await supabase.from('library').insert([{ user_id: user.id, article_id: id }]);
                setIsInLibrary(true);
                success('Added to your library', 'Library');
            }
        } catch {
            showAlertError('Failed to update library');
        }
    };

    if (status === 'loading') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-4" aria-label="Loading article">
                <div className="h-4 w-48 animate-pulse rounded bg-navy-50" />
                <div className="h-10 w-3/4 animate-pulse rounded bg-navy-50" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-navy-50" />
            </div>
        );
    }

    if (status === 'notfound') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                <h1 className="font-serif text-3xl font-bold text-navy-900 mb-3">Article not found</h1>
                <p className="text-ogene-500 mb-8">It may have been removed or the link is incorrect.</p>
                <Link to="/articles" className="text-navy-700 font-semibold hover:underline">Browse all articles</Link>
            </div>
        );
    }

    const authors = getAuthors(article);
    const published = new Date(timeline?.published_at || article.created_at);
    const pageUrl = `${window.location.origin}/article/${article.id}`;
    const textLink = 'inline-flex items-center gap-1.5 text-navy-700 transition-colors hover:text-navy-900 hover:underline underline-offset-4';
    const iconButton = 'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-200';

    return (
        <div className="bg-white">
            {/* ── Header band ─────────────────────────────────────────── */}
            <section className="border-b border-navy-100 bg-linear-to-b from-navy-50 to-navy-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 pt-6 text-[13px] text-ogene-500">
                        <Link to="/" className="shrink-0 transition-colors hover:text-navy-700">Home</Link>
                        <ChevronRight size={13} className="shrink-0 text-ogene-300" />
                        <Link to="/articles" className="shrink-0 transition-colors hover:text-navy-700">Articles</Link>
                        {article.category && (
                            <>
                                <ChevronRight size={13} className="shrink-0 text-ogene-300" />
                                <Link
                                    to={`/articles?category=${encodeURIComponent(article.category)}`}
                                    className="shrink-0 transition-colors hover:text-navy-700"
                                >
                                    {article.category}
                                </Link>
                            </>
                        )}
                        <ChevronRight size={13} className="hidden shrink-0 text-ogene-300 sm:block" />
                        <span className="hidden min-w-0 truncate text-ogene-700 sm:block" aria-current="page">{article.title}</span>
                    </nav>

                    <div className="grid gap-10 pt-10 lg:grid-cols-[132px_minmax(0,1fr)]">
                        <aside className="hidden space-y-4 lg:block" aria-label="Article metrics">
                            <Stat value={views ?? '—'} label="Views" />
                            <Stat value={citedBy ? citedBy.length : '—'} label={citedBy?.length === 1 ? 'Citation' : 'Citations'} />
                            <Stat value={authors.length || '—'} label={authors.length === 1 ? 'Author' : 'Authors'} />
                            <Stat value={published.getFullYear()} label="Published" />
                        </aside>

                        <div className="min-w-0">
                            {/* Title block keeps its own column so it wraps before the padlock. */}
                            <div className="flex items-start gap-6">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">
                                        {article.category || 'Research Article'}
                                    </p>
                                    <h1 className="mt-3 max-w-4xl text-balance font-serif text-[1.75rem] font-bold leading-[1.25] text-navy-900 md:text-[2.35rem]">
                                        {article.title}
                                    </h1>
                                    <div className="mt-5 text-[17px] leading-relaxed">
                                        <AuthorNames
                                            article={article}
                                            variant="full"
                                            nameClassName="font-semibold text-navy-700 underline-offset-4 decoration-navy-300 transition-colors hover:text-navy-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-400"
                                            className="text-ogene-600"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-ogene-500">
                                        {[
                                            timeline?.received_at && `Received ${fmtDate(timeline.received_at)}`,
                                            timeline?.accepted_at && `Accepted ${fmtDate(timeline.accepted_at)}`,
                                            `Published online: ${fmtDate(published)}`,
                                        ].filter(Boolean).join(' · ')}
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                        <button type="button" onClick={() => openTabAndReveal('citations')} className={textLink}>
                                            <Quote size={14} /> Cite this article
                                        </button>
                                        <span className="text-ogene-500 lg:hidden">{views ?? '—'} views</span>
                                    </div>
                                </div>

                                <OpenAccessBadge onClick={(e) => scrollToSection(e, 'article-pdf')} />
                            </div>

                            {/* Info tabs (sit on the band's bottom edge) + actions */}
                            <div className="mt-8 flex flex-col-reverse gap-4 md:flex-row md:items-end md:justify-between">
                                <div role="tablist" aria-label="Article information" className="flex flex-wrap overflow-visible rounded-t-lg bg-navy-100/70">
                                    {INFO_TABS.map((t) => {
                                        const Icon = t.icon;
                                        const selected = activeTab === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                role="tab"
                                                aria-selected={selected}
                                                aria-controls="article-info-panel"
                                                onClick={() => toggleTab(t.id)}
                                                className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 first:rounded-tl-lg last:rounded-tr-lg sm:px-5 ${selected
                                                    ? "z-10 bg-navy-800 text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-x-8 after:border-t-8 after:border-x-transparent after:border-t-navy-800 after:content-['']"
                                                    : 'text-navy-800 hover:bg-navy-100'}`}
                                            >
                                                <Icon size={15} />
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2.5 md:pb-2">
                                    <button
                                        type="button"
                                        onClick={toggleLibrary}
                                        title={isInLibrary ? 'Remove from library' : 'Save to library'}
                                        aria-label={isInLibrary ? 'Remove from library' : 'Save to library'}
                                        aria-pressed={isInLibrary}
                                        className={`${iconButton} ${isInLibrary ? 'border-navy-700 bg-navy-700 text-white' : 'border-navy-200 bg-white text-navy-600 hover:border-navy-400'}`}
                                    >
                                        <LibraryBig size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleFavourite}
                                        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                        aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                        aria-pressed={isFavourite}
                                        className={`${iconButton} ${isFavourite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-navy-200 bg-white text-navy-600 hover:border-rose-300 hover:text-rose-500'}`}
                                    >
                                        <Heart size={17} fill={isFavourite ? 'currentColor' : 'none'} />
                                    </button>
                                    <a
                                        href="#article-pdf"
                                        onClick={(e) => scrollToSection(e, 'article-pdf')}
                                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold-400 px-4 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:bg-gold-300"
                                    >
                                        <FileText size={16} /> View PDF
                                    </a>
                                    <ShareMenu url={pageUrl} title={article.title} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Info panel (References / Citations / Permissions) ──── */}
            <div
                id="article-info-panel"
                role="tabpanel"
                aria-hidden={!activeTab}
                className={`grid scroll-mt-24 transition-[grid-template-rows] duration-300 ease-out ${activeTab ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden" inert={!activeTab}>
                    <div className="border-b border-navy-100 bg-white">
                        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[132px_minmax(0,1fr)] lg:gap-10 lg:px-8">
                            <div className="hidden lg:block" />
                            <div className="relative max-w-4xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(null)}
                                    className="absolute right-0 top-0 rounded-full p-1.5 text-ogene-400 transition-colors hover:bg-ogene-100 hover:text-ogene-700"
                                    aria-label="Close panel"
                                >
                                    <X size={18} />
                                </button>
                                {shownTab === 'references' && <ReferencesPanel references={(article.reference_list || []).filter(Boolean)} />}
                                {shownTab === 'citations' && (
                                    <CitationsPanel
                                        title={article.title}
                                        authors={authors.map((a) => a.full_name)}
                                        published={published}
                                        url={pageUrl}
                                        citedBy={citedBy}
                                    />
                                )}
                                {shownTab === 'permissions' && <PermissionsPanel title={article.title} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto grid gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[132px_minmax(0,1fr)_296px] lg:px-8">
                {/* On this page */}
                <aside className="hidden lg:block">
                    <nav aria-label="On this page" className="sticky top-28">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ogene-400">On this page</p>
                        <ul className="space-y-1 border-l border-navy-100">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        onClick={(e) => scrollToSection(e, s.id)}
                                        className={`-ml-px block border-l-2 py-1.5 pl-3 text-sm transition-colors duration-200 ${activeSection === s.id ? 'border-gold-500 font-semibold text-navy-900' : 'border-transparent text-ogene-500 hover:text-navy-700'}`}
                                    >
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <main className="min-w-0">
                    <section id="abstract" className="scroll-mt-28">
                        <h2 className="font-serif text-2xl font-bold text-navy-900">Abstract</h2>
                        <p className="mt-5 whitespace-pre-line text-[17px] leading-8 text-ogene-700">
                            {article.description || 'No abstract was provided for this article.'}
                        </p>
                    </section>

                    {keywords.length > 0 && (
                        <section id="keywords" className="mt-10 scroll-mt-28">
                            <h3 className="font-semibold text-ogene-800">Keywords</h3>
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {keywords.map((k) => (
                                    <li key={k}>
                                        <Link
                                            to={`/articles?q=${encodeURIComponent(k)}`}
                                            className="inline-block rounded-md bg-navy-50 px-3 py-1 text-sm text-navy-700 transition-colors hover:bg-navy-100"
                                        >
                                            {k}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <hr className="my-12 border-navy-100" />

                    <section id="article-pdf" className="scroll-mt-28">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="font-serif text-2xl font-bold text-navy-900">Article PDF</h2>
                            {pdfStatus === 'ready' && (
                                <Link to={`/read/${article.id}`} className={`${textLink} text-sm font-medium`}>
                                    <Maximize2 size={14} /> Full screen
                                </Link>
                            )}
                        </div>
                        {pdfStatus === 'loading' && (
                            <div className="flex h-96 items-center justify-center rounded-lg border border-navy-100 bg-navy-50/50 text-sm text-ogene-500">
                                Loading PDF…
                            </div>
                        )}
                        {pdfStatus === 'missing' && (
                            <p className="rounded-lg border border-navy-100 bg-navy-50/50 p-8 text-center text-sm text-ogene-500">
                                The PDF for this article isn't available yet.
                            </p>
                        )}
                        {pdfStatus === 'error' && (
                            <p className="rounded-lg border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
                                The PDF couldn't be loaded. Please refresh the page to try again.
                            </p>
                        )}
                        {pdfStatus === 'ready' && (
                            <Suspense fallback={<div className="flex h-96 items-center justify-center text-sm text-ogene-500">Loading viewer…</div>}>
                                <PdfViewer fileUrl={pdfUrl} articleId={article.id} />
                            </Suspense>
                        )}
                        <p className="mt-4 text-center text-xs text-ogene-400">
                            Open access: free to read online. This article is view-only and cannot be downloaded.
                        </p>
                    </section>
                </main>

                <aside className="space-y-10">
                    {/* Publish with OGENE */}
                    <div className="relative overflow-hidden rounded-2xl bg-navy-900 p-6 text-white shadow-[0_12px_32px_rgba(10,21,48,0.18)]">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 text-navy-900">
                            <Send size={17} />
                        </span>
                        <p className="mt-4 font-serif text-xl font-bold leading-snug">Publish with OGENE</p>
                        <p className="mt-2 text-sm leading-relaxed text-navy-200">
                            Share your research with readers everywhere. Open access, with double-blind peer review.
                        </p>
                        <Link
                            to="/submit"
                            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gold-400 text-sm font-bold text-navy-900 transition-colors duration-200 hover:bg-gold-300"
                        >
                            Submit an article
                        </Link>
                        <Link
                            to="/guidelines"
                            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-navy-200 transition-colors hover:text-white"
                        >
                            <BookOpen size={13} /> Author guidelines
                        </Link>
                    </div>

                    {related.length > 0 && (
                        <section id="related" className="scroll-mt-28">
                            <h2 className="font-serif text-xl font-bold text-navy-900">Related research</h2>
                            <div className="mt-2 h-0.5 w-10 rounded-full bg-gold-400" />
                            <ul className="mt-5 divide-y divide-navy-100 overflow-hidden rounded-xl border border-navy-100 bg-white">
                                {related.map((r) => (
                                    <li key={r.id}>
                                        <Link to={`/article/${r.id}`} className="group block p-5 transition-colors duration-200 hover:bg-navy-50/60">
                                            <p className="font-medium leading-snug text-navy-800 line-clamp-3 group-hover:text-navy-900 group-hover:underline underline-offset-4">
                                                {r.title}
                                            </p>
                                            <p className="mt-1.5 truncate text-xs text-ogene-500">{formatAuthorsShort(getAuthors(r))}</p>
                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <span className="whitespace-nowrap text-xs text-ogene-400">{fmtDate(r.created_at)}</span>
                                                <OpenAccessBadge size="sm" />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>

            <BrowseBySubject />
        </div>
    );
}
