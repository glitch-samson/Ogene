import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';

/** Navy "Browse articles by subject" band shown above the footer. */
export default function BrowseBySubject() {
    return (
        <section className="bg-navy-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="font-serif text-2xl">Browse articles by subject</h2>
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-white"
                    >
                        Back to top
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-400">
                            <ArrowUp size={14} />
                        </span>
                    </button>
                </div>
                <ul className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.map((c) => (
                        <li key={c} className="border-b border-white/10">
                            <Link
                                to={`/articles?category=${encodeURIComponent(c)}`}
                                className="block py-3.5 font-medium text-navy-100 transition-colors hover:text-gold-300"
                            >
                                {c}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
