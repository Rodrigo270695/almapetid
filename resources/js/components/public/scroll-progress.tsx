import { useScrollY } from '@/hooks/use-scroll-y';

/** Barra de progreso de lectura (tendencia scroll storytelling). */
export function ScrollProgress() {
    const y = useScrollY();
    const max =
        typeof document !== 'undefined'
            ? Math.max(
                  document.documentElement.scrollHeight - window.innerHeight,
                  1,
              )
            : 1;
    const progress = Math.min(Math.max(y / max, 0), 1);

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2.5px] bg-transparent"
        >
            <div
                className="h-full origin-left bg-gradient-to-r from-brand-sky via-[var(--brand-coral)] to-brand-sky transition-[width] duration-75 ease-out"
                style={{ width: `${progress * 100}%` }}
            />
        </div>
    );
}
