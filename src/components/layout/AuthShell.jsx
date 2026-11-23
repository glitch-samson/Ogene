import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared frame for the login and sign-up pages: a simple "submission portal"
 * layout with the form on the left and what the portal offers on the right.
 */
export default function AuthShell({ title, subtitle, children, tiles }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#f5f6f8] font-sans">
            <header className="bg-white">
                <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/ogene-logo.png" alt="" className="h-12 w-auto" />
                        <span className="flex flex-col gap-0.5 leading-none text-navy-600">
                            <span className="text-xl font-bold tracking-wide">OGENE</span>
                            <span className="text-xs font-semibold tracking-[0.22em] text-navy-500">JOURNAL</span>
                        </span>
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 md:py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-ogene-900 md:text-4xl">{title}</h1>
                    <p className="mt-3 text-lg text-ogene-500">{subtitle}</p>
                </div>

                <div className="mt-8 rounded-lg bg-white px-6 py-5 text-center shadow-[0_2px_10px_rgba(10,21,48,0.08)]">
                    <p className="text-ogene-700">
                        You are entering the submission site for{' '}
                        <Link to="/" className="font-semibold text-navy-700 hover:underline underline-offset-4">OGENE Journal</Link>
                    </p>
                </div>

                <div className="mt-6 grid overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_rgba(10,21,48,0.08)] md:grid-cols-2">
                    <div className="px-6 py-10 sm:px-12 md:py-12">{children}</div>
                    <div className="border-t border-dashed border-navy-200 px-6 py-10 sm:px-12 md:border-l md:border-t-0 md:py-12">
                        <ul className="space-y-4">
                            {tiles.map((tile) => {
                                const Icon = tile.icon;
                                return (
                                    <li key={tile.title} className="flex overflow-hidden rounded-md bg-navy-50/70">
                                        <span className="flex w-16 shrink-0 items-center justify-center bg-navy-100/70 text-navy-700">
                                            <Icon size={22} />
                                        </span>
                                        <div className="px-5 py-4">
                                            <p className="text-lg text-ogene-900">{tile.title}</p>
                                            <p className="mt-1 text-sm text-ogene-600">{tile.text}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-xs text-ogene-400">
                &copy; {new Date().getFullYear()} OGENE Journal · African University of Benin
            </footer>
        </div>
    );
}

/** Text input styled for the portal forms. */
export function PortalInput({ id, label, className = '', ...props }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ogene-700">{label}</label>
            <input
                id={id}
                className={`h-12 w-full rounded-md border border-ogene-300 bg-white px-4 text-ogene-900 placeholder:text-ogene-400 transition-colors focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200 ${className}`}
                {...props}
            />
        </div>
    );
}
