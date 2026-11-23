import React, { useEffect, useRef, useState } from 'react';
import { Share2, Link2, Mail, MessageCircle, Check } from 'lucide-react';

const shareTargets = (url, title) => {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    return [
        { label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, badge: '𝕏' },
        { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, badge: 'in' },
        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, badge: 'f' },
        { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: MessageCircle },
        { label: 'Email', href: `mailto:?subject=${t}&body=${t}%0A%0A${u}`, icon: Mail },
    ];
};

export default function ShareMenu({ url, title, className = '' }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    const nativeShare = async () => {
        try {
            await navigator.share({ title, url });
            setOpen(false);
        } catch {
            // user dismissed the share sheet
        }
    };

    const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ogene-700 hover:bg-navy-50 hover:text-navy-800';

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex items-center gap-2 rounded-md bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
                <Share2 size={16} /> Share
            </button>

            {open && (
                <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-navy-100 bg-white p-1.5 shadow-[0_12px_32px_rgba(10,21,48,0.14)]">
                    <button role="menuitem" onClick={copyLink} className={item}>
                        {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}
                        {copied ? 'Link copied' : 'Copy link'}
                    </button>
                    {shareTargets(url, title).map((t) => {
                        const Icon = t.icon;
                        return (
                            <a key={t.label} role="menuitem" href={t.href} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
                                {Icon ? (
                                    <Icon size={16} />
                                ) : (
                                    <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center text-[11px] font-bold">{t.badge}</span>
                                )}
                                {t.label}
                            </a>
                        );
                    })}
                    {typeof navigator !== 'undefined' && navigator.share && (
                        <button role="menuitem" onClick={nativeShare} className={item}>
                            <Share2 size={16} /> More options…
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
