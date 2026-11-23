import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CitationTool } from './ArticleTabPanels';

/** "Cite this article" pop-up: the same citation tool as the Citations tab. */
export default function CiteModal({ open, onClose, title, authors, published, url }) {
    const closeRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const previouslyFocused = document.activeElement;
        closeRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            previouslyFocused?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div role="dialog" aria-modal="true" aria-labelledby="cite-title" className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                <div className="mb-1 flex items-start justify-between gap-4">
                    <div>
                        <h2 id="cite-title" className="font-serif text-xl font-bold text-navy-900">Cite this article</h2>
                        <p className="mt-1 text-sm text-ogene-500">Choose a citation style, then copy it into your reference list.</p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-ogene-400 transition-colors hover:bg-ogene-100 hover:text-ogene-700"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="mt-5">
                    <CitationTool title={title} authors={authors} published={published} url={url} />
                </div>
            </div>
        </div>,
        document.body,
    );
}
