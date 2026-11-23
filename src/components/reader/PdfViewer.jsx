import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const MAX_PAGE_WIDTH = 900;
const A4_RATIO = 1.414;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Continuous-scroll PDF viewer with page and zoom controls. View-only by
 * design: no download or print button, and the context menu is suppressed.
 * Pages render lazily as they approach the visible area.
 */
export default function PdfViewer({
    fileUrl,
    articleId,
    heightClass = 'h-[78vh] max-h-[960px] min-h-[420px]',
    showFullScreenLink = true,
    className = '',
}) {
    const [numPages, setNumPages] = useState(0);
    const [current, setCurrent] = useState(1);
    const [zoomIndex, setZoomIndex] = useState(2);
    const [containerWidth, setContainerWidth] = useState(0);
    const [rendered, setRendered] = useState(() => new Set([1, 2]));
    const scrollRef = useRef(null);
    const pageRefs = useRef([]);

    const zoom = ZOOM_STEPS[zoomIndex];
    const fitWidth = Math.max(240, Math.min(containerWidth - 32, MAX_PAGE_WIDTH));
    const pageWidth = Math.round(fitWidth * zoom);

    // Track the container width so pages fit it.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;
        const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Render a page once it comes within ~1.5 screens of the viewport.
    useEffect(() => {
        const root = scrollRef.current;
        if (!root || !numPages) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const due = entries.filter((e) => e.isIntersecting).map((e) => Number(e.target.dataset.page));
                if (due.length) {
                    setRendered((prev) => {
                        if (due.every((n) => prev.has(n))) return prev;
                        const next = new Set(prev);
                        due.forEach((n) => next.add(n));
                        return next;
                    });
                }
            },
            { root, rootMargin: '150% 0px' },
        );
        pageRefs.current.slice(0, numPages).forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [numPages]);

    const handleScroll = () => {
        const root = scrollRef.current;
        if (!root) return;
        const probe = root.scrollTop + root.clientHeight / 3;
        let page = 1;
        for (let i = 0; i < numPages; i += 1) {
            const el = pageRefs.current[i];
            if (el && el.offsetTop <= probe) page = i + 1;
        }
        if (page !== current) setCurrent(page);
    };

    const goTo = (page) => {
        const target = Math.min(Math.max(page, 1), numPages || 1);
        const el = pageRefs.current[target - 1];
        if (el && scrollRef.current) {
            scrollRef.current.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
        }
    };

    const toolButton =
        'p-1.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors';

    return (
        <div className={`overflow-hidden rounded-lg border border-ogene-300 bg-ogene-700 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-ogene-800 px-3 py-2 text-white">
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => goTo(current - 1)} disabled={current <= 1} className={toolButton} aria-label="Previous page">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="min-w-16 text-center text-sm tabular-nums">
                        {numPages ? `${current} / ${numPages}` : '– / –'}
                    </span>
                    <button type="button" onClick={() => goTo(current + 1)} disabled={!numPages || current >= numPages} className={toolButton} aria-label="Next page">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))} disabled={zoomIndex === 0} className={toolButton} aria-label="Zoom out">
                        <ZoomOut size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoomIndex(2)}
                        className="min-w-20 rounded px-2 py-1 text-xs hover:bg-white/10"
                        title="Fit to width"
                    >
                        {zoom === 1 ? 'Page width' : `${Math.round(zoom * 100)}%`}
                    </button>
                    <button type="button" onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))} disabled={zoomIndex === ZOOM_STEPS.length - 1} className={toolButton} aria-label="Zoom in">
                        <ZoomIn size={18} />
                    </button>
                    {showFullScreenLink && articleId && (
                        <Link to={`/read/${articleId}`} className={`${toolButton} ml-1`} aria-label="Open full screen" title="Full screen">
                            <Maximize2 size={17} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Pages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative overflow-auto bg-ogene-200/70 ${heightClass}`}
            >
                <Document
                    file={fileUrl}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    loading={<div className="p-10 text-center text-sm text-ogene-500">Loading PDF…</div>}
                    error={<div className="p-10 text-center text-sm text-red-600">This PDF couldn't be displayed.</div>}
                    className="flex flex-col items-center gap-4 py-4"
                >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                        <div
                            key={n}
                            data-page={n}
                            ref={(el) => { pageRefs.current[n - 1] = el; }}
                            className="bg-white shadow-md"
                            style={rendered.has(n) ? undefined : { width: pageWidth, height: Math.round(pageWidth * A4_RATIO) }}
                        >
                            {rendered.has(n) && containerWidth > 0 && (
                                <Page
                                    pageNumber={n}
                                    width={pageWidth}
                                    renderAnnotationLayer
                                    renderTextLayer
                                    loading={<div style={{ width: pageWidth, height: Math.round(pageWidth * A4_RATIO) }} />}
                                />
                            )}
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
}
