import { useEffect } from 'react';

/** Smooth scroll nativo + offset por navbar fijo en anclas #. */
export function useSmoothAnchors() {
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';

        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest('a[href^="/#"], a[href^="#"]') as
                | HTMLAnchorElement
                | null;
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            const hash = href.includes('#') ? href.split('#')[1] : '';
            if (!hash) return;

            const el = document.getElementById(hash);
            if (!el) return;

            // Solo interceptar si estamos en la home
            if (href.startsWith('/#') && window.location.pathname !== '/') {
                return;
            }
            if (href.startsWith('#') || window.location.pathname === '/') {
                e.preventDefault();
                const top =
                    el.getBoundingClientRect().top + window.scrollY - 72;
                window.scrollTo({ top, behavior: 'smooth' });
                history.replaceState(null, '', `#${hash}`);
            }
        };

        document.addEventListener('click', onClick);
        return () => {
            document.removeEventListener('click', onClick);
            document.documentElement.style.scrollBehavior = '';
        };
    }, []);
}
