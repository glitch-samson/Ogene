import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// We decide scroll position ourselves instead of letting the browser restore it,
// so a reload always lands at the top of the page.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

/**
 * - Reload / first load: start at the top.
 * - Clicking a link (PUSH/REPLACE): start the new page at the top.
 * - Back/Forward (POP): return to where you were on that page.
 * - Same page, new query string (filters, sorting): don't move.
 * - Links with a #hash: scroll to that section.
 */
export default function ScrollManager() {
    const { key, hash, pathname } = useLocation();
    const navigationType = useNavigationType();
    const positions = useRef({});
    const isFirstRender = useRef(true);
    const prevPathname = useRef(pathname);

    // Remember the scroll position of the current history entry.
    useEffect(() => {
        const save = () => {
            positions.current[key] = window.scrollY;
        };
        window.addEventListener('scroll', save, { passive: true });
        return () => window.removeEventListener('scroll', save);
    }, [key]);

    useLayoutEffect(() => {
        if (hash) {
            // Links like /#contact-us: scroll to that section once the new page
            // has rendered (it may mount a frame or two after the URL changes).
            const smooth = !isFirstRender.current;
            isFirstRender.current = false;
            let frame = 0;
            let raf;
            const tryScroll = () => {
                const el = document.getElementById(decodeURIComponent(hash.slice(1)));
                if (el) {
                    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
                } else if (frame++ < 30) {
                    raf = requestAnimationFrame(tryScroll);
                }
            };
            tryScroll();
            return () => cancelAnimationFrame(raf);
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevPathname.current = pathname;
            window.scrollTo(0, 0);
            return undefined;
        }

        // Only the query string changed (filters, sorting, paging on the same
        // page): leave the scroll position to the page itself.
        if (pathname === prevPathname.current) return undefined;
        prevPathname.current = pathname;

        const saved = positions.current[key];
        window.scrollTo(0, navigationType === 'POP' && saved != null ? saved : 0);
    }, [key, hash, pathname, navigationType]);

    return null;
}
