import {
    type CSSProperties,
    type ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
    from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';
    once?: boolean;
    as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'span';
};

const FROM_HIDDEN: Record<NonNullable<RevealProps['from']>, string> = {
    up: 'translate-y-10 opacity-0',
    down: '-translate-y-10 opacity-0',
    left: 'translate-x-12 opacity-0',
    right: '-translate-x-12 opacity-0',
    scale: 'scale-[0.92] opacity-0',
    blur: 'translate-y-6 opacity-0 blur-md',
};

export function Reveal({
    children,
    className,
    delay = 0,
    from = 'up',
    once = true,
    as: Tag = 'div',
}: RevealProps) {
    const ref = useRef<HTMLElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (reduced) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.unobserve(el);
                } else if (!once) {
                    setVisible(false);
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [once]);

    return (
        <Tag
            ref={ref as never}
            className={cn(
                'transition-[opacity,transform,filter] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
                visible
                    ? 'translate-x-0 translate-y-0 scale-100 opacity-100 blur-0'
                    : FROM_HIDDEN[from],
                className,
            )}
            style={
                {
                    transitionDelay: visible ? `${delay}ms` : '0ms',
                } as CSSProperties
            }
        >
            {children}
        </Tag>
    );
}

/** Parallax suave ligado al scroll dentro del elemento. */
export function Parallax({
    children,
    className,
    speed = 0.18,
}: {
    children: ReactNode;
    className?: string;
    speed?: number;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (reduced) return;

        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
                setOffset(-mid * speed);
            });
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [speed]);

    return (
        <div ref={ref} className={cn('overflow-hidden', className)}>
            <div
                className="will-change-transform"
                style={{ transform: `translate3d(0, ${offset}px, 0)` }}
            >
                {children}
            </div>
        </div>
    );
}
