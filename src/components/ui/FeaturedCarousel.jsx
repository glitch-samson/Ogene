import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import AuthorNames from '../authors/AuthorNames';

const INTERVAL_MS = 7000;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const formatDate = (value) =>
    new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

const controlClass =
    'h-9 w-9 shrink-0 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400';

/**
 * Rotating "Featured Research" hero card.
 *
 * Advancing is driven by the gold progress bar's CSS animation ending, so pausing
 * (hover, keyboard focus, or the pause button) freezes the bar and the timer together.
 */
export default function FeaturedCarousel({ items }) {
    const [index, setIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [keyboardFocus, setKeyboardFocus] = useState(false);
    const [stopped, setStopped] = useState(prefersReducedMotion);
    const touchStartX = useRef(null);

    const count = items.length;
    if (count === 0) return null;

    const hasMany = count > 1;
    const active = index < count ? index : 0;
    const item = items[active];
    const paused = stopped || hovered || keyboardFocus;

    const go = (i) => setIndex(((i % count) + count) % count);
    const next = () => go(active + 1);
    const prev = () => go(active - 1);

    const handleKeyDown = (e) => {
        if (!hasMany) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    };

    const handleTouchEnd = (e) => {
        if (!hasMany || touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    };

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Featured research"
            className="group relative mb-16 grid min-h-120 overflow-hidden rounded-3xl border border-ogene-100 bg-navy-900 shadow-xl"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={(e) => e.target.matches(':focus-visible') && setKeyboardFocus(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setKeyboardFocus(false)}
            onKeyDown={handleKeyDown}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slides share one grid cell, so the card grows to fit the tallest
                slide instead of clipping it, and old/new overlap during the fade. */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={item.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${active + 1} of ${count}`}
                    className="relative col-start-1 row-start-1 flex flex-col justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    {item.cover_image ? (
                        <img
                            src={item.cover_image}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-navy-900">
                            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            <span className="select-none font-serif text-6xl italic tracking-[0.3em] text-white/10">OGENE</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-navy-900 via-navy-900/65 to-navy-900/5"></div>

                    <motion.div
                        className="relative p-8 pt-20 md:p-12 md:pt-16"
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-black uppercase tracking-widest text-navy-900">Featured</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-gold-200">{item.category || 'Research'}</span>
                        </div>

                        <h3 className="mb-4 max-w-3xl font-serif text-2xl font-bold leading-tight text-white line-clamp-3 md:text-4xl">
                            <Link to={`/article/${item.id}`} className="hover:text-gold-100 transition-colors">
                                {item.title}
                            </Link>
                        </h3>

                        {item.description && (
                            <p className="mb-5 max-w-2xl leading-relaxed text-navy-100 line-clamp-2 max-sm:hidden">
                                {item.description}
                            </p>
                        )}

                        <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-navy-200">
                            <AuthorNames
                                article={item}
                                variant="short"
                                className="font-semibold text-white"
                                nameClassName="font-semibold text-white underline-offset-4 decoration-white/40 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                            />
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {formatDate(item.created_at)}
                            </span>
                        </div>

                        <div>
                            <Link
                                to={`/article/${item.id}`}
                                className="group/btn inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 shadow-lg shadow-black/20 transition-colors hover:bg-gold-300"
                            >
                                Read more
                                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-0.5" />
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {hasMany && (
                <div className="absolute right-5 top-5 z-10 flex items-center gap-2 md:bottom-12 md:right-12 md:top-auto">
                    <button type="button" onClick={prev} aria-label="Previous featured article" className={controlClass}>
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center px-1">
                        {items.map((it, i) => (
                            <button
                                key={it.id}
                                type="button"
                                onClick={() => go(i)}
                                aria-label={`Show featured article ${i + 1}`}
                                aria-current={i === active}
                                className="p-1.5"
                            >
                                {i === active ? (
                                    <span className="block h-1.5 w-8 overflow-hidden rounded-full bg-white/25">
                                        <span
                                            key={active}
                                            className="block h-full w-full origin-left rounded-full bg-gold-400"
                                            style={{
                                                animation: `featured-progress ${INTERVAL_MS}ms linear forwards`,
                                                animationPlayState: paused ? 'paused' : 'running',
                                            }}
                                            onAnimationEnd={next}
                                        />
                                    </span>
                                ) : (
                                    <span className="block h-1.5 w-1.5 rounded-full bg-white/40 transition-colors hover:bg-white/80" />
                                )}
                            </button>
                        ))}
                    </div>

                    <button type="button" onClick={next} aria-label="Next featured article" className={controlClass}>
                        <ChevronRight size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setStopped((s) => !s)}
                        aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'}
                        className={controlClass}
                    >
                        {stopped ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                </div>
            )}
        </section>
    );
}
