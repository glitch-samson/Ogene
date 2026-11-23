import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { fetchAuthorCard, orcidUrl, externalUrl, initials } from '../../lib/authors';

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;
const PANEL_WIDTH = 352; // keep in sync with w-88 below
const PANEL_HEIGHT_ESTIMATE = 360;
const EDGE = 16;

export function OrcidBadge({ className = '' }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A6CE39] text-[8px] font-bold leading-none text-white ${className}`}
        >
            iD
        </span>
    );
}

export function LinkedInBadge({ className = '' }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-[#0A66C2] text-[9px] font-bold leading-none text-white ${className}`}
        >
            in
        </span>
    );
}

function Section({ title, children }) {
    return (
        <div className="mt-4 border-t border-navy-100 pt-3">
            <p className="mb-1.5 text-sm font-semibold text-ogene-800">{title}</p>
            {children}
        </div>
    );
}

/**
 * The card body. Exported so the profile page can show a live preview.
 * `card` is the author_card() payload (or a draft with the same shape).
 */
export function AuthorCardPanel({ card, name, status = 'ready' }) {
    const displayName = card?.full_name || name;
    const email = card?.email;
    const orcid = orcidUrl(card?.orcid);
    const linkedin = externalUrl(card?.linkedin_url);
    const contributions = card?.contributions || [];
    const others = card?.other_articles || [];
    const hasCorrespondence = email || orcid || linkedin;

    return (
        <div className="w-88 max-w-[calc(100vw-2rem)] rounded-xl border border-navy-100 bg-white p-5 text-left text-ogene-700 shadow-[0_16px_40px_rgba(10,21,48,0.16)]">
            <div className="flex items-start gap-3">
                {card?.avatar_url ? (
                    <img src={card.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-navy-100" />
                ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700">
                        {initials(displayName)}
                    </span>
                )}
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[17px] font-semibold leading-snug text-navy-700">
                        <span>{displayName}</span>
                        {card?.is_corresponding && email && (
                            <Mail size={15} className="shrink-0" aria-label="Corresponding author" />
                        )}
                    </p>
                    {card?.affiliation && (
                        <p className="mt-1 text-sm leading-relaxed text-ogene-600">{card.affiliation}</p>
                    )}
                </div>
            </div>

            {status === 'loading' && (
                <div className="mt-4 space-y-2" aria-label="Loading author details">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-navy-50" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-navy-50" />
                </div>
            )}

            {status === 'error' && (
                <p className="mt-4 text-sm text-ogene-500">Couldn't load this author's details.</p>
            )}

            {status === 'ready' && (
                <>
                    {hasCorrespondence && (
                        <Section title="Correspondence">
                            <ul className="space-y-1.5 text-sm">
                                {email && (
                                    <li>
                                        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 break-all text-navy-700 hover:underline">
                                            <Mail size={15} className="shrink-0" />
                                            {email}
                                        </a>
                                    </li>
                                )}
                                {orcid && (
                                    <li>
                                        <a href={orcid} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all text-navy-700 hover:underline">
                                            <OrcidBadge />
                                            {orcid}
                                        </a>
                                    </li>
                                )}
                                {linkedin && (
                                    <li>
                                        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-navy-700 hover:underline">
                                            <LinkedInBadge />
                                            LinkedIn profile
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </Section>
                    )}

                    {contributions.length > 0 && (
                        <Section title="Contribution">
                            <p className="text-sm leading-relaxed">{contributions.join(', ')}</p>
                        </Section>
                    )}

                    {others.length > 0 && (
                        <Section title="Other articles">
                            <ul className="space-y-2">
                                {others.map((a) => (
                                    <li key={a.id}>
                                        <Link to={`/article/${a.id}`} className="block text-sm leading-snug text-navy-700 hover:underline line-clamp-2">
                                            {a.title}
                                        </Link>
                                        <span className="text-xs text-ogene-400">{new Date(a.created_at).getFullYear()}</span>
                                    </li>
                                ))}
                            </ul>
                            {card.article_count > others.length + 1 && (
                                <p className="mt-2 text-xs text-ogene-500">{card.article_count} articles in OGENE in total</p>
                            )}
                        </Section>
                    )}

                    {!hasCorrespondence && contributions.length === 0 && others.length === 0 && !card?.affiliation && (
                        <p className="mt-3 text-sm text-ogene-500">No further details yet.</p>
                    )}
                </>
            )}
        </div>
    );
}

// Fixed-position coordinates for the panel, kept inside the viewport and
// flipped above the name when there isn't room below.
function computePosition(trigger) {
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 2 * EDGE);
    const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - EDGE - width));
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < PANEL_HEIGHT_ESTIMATE && rect.top > spaceBelow;
    return above
        ? { left, bottom: window.innerHeight - rect.top + 8 }
        : { left, top: rect.bottom + 8 };
}

function HoverCardTrigger({ author, articleId, className }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const [card, setCard] = useState(null);
    const [status, setStatus] = useState('idle');
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const openTimer = useRef(null);
    const closeTimer = useRef(null);
    // Returning focus to the name after Escape must not reopen the card.
    const skipFocusOpen = useRef(false);

    const clearTimers = () => {
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
    };

    useEffect(() => clearTimers, []);

    useEffect(() => {
        if (!open) return;
        const isInside = (node) =>
            triggerRef.current?.contains(node) || panelRef.current?.contains(node);
        const onPointerDown = (e) => {
            if (!isInside(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                clearTimers();
                setOpen(false);
                skipFocusOpen.current = true;
                triggerRef.current?.focus();
                skipFocusOpen.current = false;
            }
        };
        const reposition = () => {
            if (triggerRef.current) setPosition(computePosition(triggerRef.current));
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open]);

    const load = () => {
        if (status === 'loading' || status === 'ready') return;
        setStatus('loading');
        fetchAuthorCard(author.id, articleId)
            .then((data) => {
                setCard(data);
                setStatus(data ? 'ready' : 'error');
            })
            .catch(() => setStatus('error'));
    };

    const show = () => {
        clearTimers();
        if (triggerRef.current) setPosition(computePosition(triggerRef.current));
        setOpen(true);
        load();
    };

    const scheduleOpen = (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimers();
        openTimer.current = setTimeout(show, OPEN_DELAY_MS);
    };

    const scheduleClose = (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimers();
        closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    };

    const keepOpen = (e) => {
        if (e.pointerType === 'mouse') clearTimers();
    };

    const closeIfFocusLeft = (e) => {
        const next = e.relatedTarget;
        if (!triggerRef.current?.contains(next) && !panelRef.current?.contains(next)) setOpen(false);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onPointerEnter={scheduleOpen}
                onPointerLeave={scheduleClose}
                onClick={() => (open ? setOpen(false) : show())}
                onFocus={(e) => !skipFocusOpen.current && e.target.matches(':focus-visible') && show()}
                onBlur={closeIfFocusLeft}
                className={className || 'font-medium text-navy-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-400'}
            >
                {author.full_name}
            </button>

            {/* Portalled so overflow-hidden parents (e.g. the featured carousel)
                can't clip it and it never nests block content inside text. */}
            {open && position && createPortal(
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-label={`About ${author.full_name}`}
                    className="fixed z-60"
                    style={position}
                    onPointerEnter={keepOpen}
                    onPointerLeave={scheduleClose}
                    onBlur={closeIfFocusLeft}
                >
                    <AuthorCardPanel
                        card={card ? { ...card, is_corresponding: card.is_corresponding ?? author.is_corresponding } : { full_name: author.full_name, avatar_url: author.avatar_url }}
                        name={author.full_name}
                        status={status === 'idle' ? 'loading' : status}
                    />
                </div>,
                document.body,
            )}
        </>
    );
}

/**
 * An author's name that opens their card on hover (desktop), tap (touch) or
 * keyboard focus. Authors without an id (articles predating author records)
 * render as plain text.
 */
export default function AuthorHoverCard({ author, articleId = null, className = '' }) {
    if (!author?.id) {
        return <span className={className}>{author?.full_name}</span>;
    }
    return <HoverCardTrigger author={author} articleId={articleId} className={className} />;
}
