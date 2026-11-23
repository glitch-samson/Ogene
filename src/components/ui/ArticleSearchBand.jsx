import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';

/**
 * Homepage search band: sends the query to the Articles page, which searches
 * titles, abstracts, authors and keywords.
 */
export default function ArticleSearchBand({ articleCount }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const submit = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/articles?q=${encodeURIComponent(q)}` : '/articles');
    };

    return (
        <section className="relative overflow-hidden border-b border-navy-100 bg-linear-to-br from-navy-50 via-white to-navy-100/70">
            {/* Soft dot texture */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                    backgroundImage: 'radial-gradient(var(--color-navy-200) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                }}
            />

            <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-20">
                <h2 className="font-serif text-3xl leading-tight text-navy-900 md:text-[2.75rem]">
                    Search peer-reviewed research
                </h2>

                <form role="search" onSubmit={submit} className="mt-9 flex gap-2">
                    <label htmlFor="home-search" className="sr-only">Search articles</label>
                    <input
                        id="home-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter keywords, authors or titles"
                        className="h-14 min-w-0 flex-1 rounded-md border border-navy-100 bg-white px-5 text-base text-ogene-900 shadow-[0_4px_16px_rgba(10,21,48,0.08)] placeholder:text-ogene-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-200"
                    />
                    <button
                        type="submit"
                        aria-label="Search"
                        title="Search"
                        className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-navy-800 text-white shadow-[0_4px_16px_rgba(10,21,48,0.18)] transition-colors hover:bg-navy-900"
                    >
                        <Search size={22} strokeWidth={2.5} />
                    </button>
                </form>

                {articleCount != null && (
                    <p className="mt-8 text-xl text-ogene-700 md:text-2xl">
                        <span className="tabular-nums">{Number(articleCount).toLocaleString()}</span> articles
                        <span className="mx-3 text-ogene-300 md:mx-4">|</span>
                        {CATEGORIES.length} subject areas
                    </p>
                )}

                <Link
                    to="/articles"
                    className="mt-8 inline-flex h-14 items-center gap-3 rounded-md bg-navy-800 px-12 font-semibold text-white transition-colors hover:bg-navy-900"
                >
                    <Search size={18} strokeWidth={2.5} /> Browse all articles
                </Link>
            </div>
        </section>
    );
}
