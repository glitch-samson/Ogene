import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { SITE } from '../../lib/site';

function XLogo({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
    );
}

const SOCIALS = [
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'x', label: 'X (Twitter)', icon: XLogo },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'youtube', label: 'YouTube', icon: Youtube },
];

const COLUMNS = [
    {
        title: 'Information for',
        links: [
            { label: 'Authors', to: '/guidelines' },
            { label: 'Readers', to: '/articles' },
            { label: 'Editors', to: '/editorial-board' },
        ],
    },
    {
        title: 'Open access',
        links: [
            { label: 'Browse articles', to: '/articles' },
            { label: 'Submit a manuscript', to: '/submit' },
            { label: 'Track your submission', to: '/manuscripts' },
        ],
    },
    {
        title: 'Help and information',
        links: [
            { label: 'About OGENE', to: '/about' },
            { label: 'Editorial board', to: '/editorial-board' },
            { label: 'Contact us', to: '/#contact-us' },
        ],
    },
];

export default function SiteFooter() {
    const socials = SOCIALS.filter((s) => SITE.socials[s.key]);
    const linkClass = 'text-navy-200 transition-colors duration-200 hover:text-white';

    return (
        <footer className="mt-auto bg-navy-900 text-white">
            <div className="max-w-7xl mx-auto px-4 pt-14 pb-10 sm:px-6 lg:px-8">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h2 className="text-lg font-medium">{col.title}</h2>
                            <ul className="mt-5 space-y-3">
                                {col.links.map((l) => (
                                    <li key={l.label}>
                                        <Link to={l.to} className={linkClass}>{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <h2 className="text-lg font-medium">Keep up to date</h2>
                        <p className="mt-5 text-sm leading-relaxed text-navy-200">
                            Follow the {SITE.publisher} for news, calls for papers and updates.
                        </p>
                        {socials.length > 0 && (
                            <ul className="mt-4 flex flex-wrap gap-2.5" aria-label={`${SITE.publisher} on social media`}>
                                {socials.map((s) => {
                                    const Icon = s.icon;
                                    return (
                                        <li key={s.key}>
                                            <a
                                                href={SITE.socials[s.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={s.label}
                                                title={s.label}
                                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-gold-400 hover:text-navy-900"
                                            >
                                                <Icon size={18} />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <a
                            href={SITE.publisherUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-white"
                        >
                            <Globe size={15} /> {SITE.publisherDomain}
                        </a>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-8 border-t border-white/10 pt-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3 text-sm">
                        <p>
                            <span className="font-semibold">Copyright &copy; {new Date().getFullYear()} {SITE.journal}</span>
                            <span className="text-navy-300"> · Published by the {SITE.publisher}</span>
                        </p>
                        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-navy-200">
                            <li className="inline-flex items-center gap-2">
                                <MapPin size={14} className="text-navy-300" /> {SITE.location}
                            </li>
                            <li>
                                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                                    <Mail size={14} className="text-navy-300" /> {SITE.email}
                                </a>
                            </li>
                            <li>
                                <a href={SITE.phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                                    <Phone size={14} className="text-navy-300" /> {SITE.phone}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <a
                        href={SITE.publisherUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 self-start lg:self-auto"
                    >
                        <img src="/aub-seal.png" alt="" className="h-16 w-16 rounded-full bg-white p-1" />
                        <span className="leading-tight">
                            <span className="block font-serif text-xl">African University</span>
                            <span className="block font-serif text-xl">of Benin</span>
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
