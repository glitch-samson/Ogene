import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';

export default function Blog() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto">
                <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center">
                    <Newspaper size={30} />
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-4">Blog</h1>
                <p className="text-lg text-ogene-600 mb-10">
                    News, editorial notes and research highlights from OGENE Journal are coming soon.
                </p>
                <Link
                    to="/articles"
                    className="inline-flex items-center rounded-full bg-navy-700 px-7 py-3 font-semibold text-white hover:bg-navy-800 transition-colors"
                >
                    Browse published research
                </Link>
            </div>
        </div>
    );
}
