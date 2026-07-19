import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AuthGlassCardProps = {
    children: ReactNode;
    className?: string;
};

/**
 * Card liquid-glass con acentos “animal” (huellas + glow).
 */
export default function AuthGlassCard({
    children,
    className,
}: AuthGlassCardProps) {
    return (
        <div className="relative mx-auto w-full max-w-[620px]">
            {/* Halo */}
            <div
                aria-hidden
                className="absolute -inset-5 rounded-[2.25rem] bg-gradient-to-br from-brand-sky/40 via-brand-sky/5 to-brand-coral/45 opacity-90 blur-3xl"
            />

            <div
                className={cn(
                    'auth-glass auth-vt-card relative overflow-hidden p-7 sm:p-9',
                    className,
                )}
            >
                {/* Refracción superior */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/30"
                />

                {/* Brillo diagonal suave */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -left-16 size-56 rounded-full bg-white/40 blur-3xl dark:bg-white/5"
                />

                {/* Huellas */}
                <svg
                    aria-hidden
                    className="pointer-events-none absolute -right-1 -bottom-1 size-40 text-brand-sky/20 dark:text-brand-sky/25"
                    viewBox="0 0 120 120"
                    fill="currentColor"
                >
                    <ellipse cx="38" cy="72" rx="18" ry="22" />
                    <circle cx="22" cy="42" r="9" />
                    <circle cx="42" cy="32" r="9" />
                    <circle cx="62" cy="36" r="8.5" />
                    <circle cx="74" cy="52" r="8" />
                    <ellipse
                        cx="88"
                        cy="28"
                        rx="10"
                        ry="12"
                        className="opacity-45"
                    />
                    <circle cx="78" cy="12" r="5" className="opacity-45" />
                    <circle cx="92" cy="10" r="5" className="opacity-45" />
                    <circle cx="102" cy="18" r="4.5" className="opacity-45" />
                </svg>

                {/* Grain */}
                <svg
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay dark:opacity-[0.09]"
                >
                    <filter id="almapet-card-grain">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="1.8"
                            numOctaves="2"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect
                        width="100%"
                        height="100%"
                        filter="url(#almapet-card-grain)"
                    />
                </svg>

                <div className="relative z-10">{children}</div>
            </div>
        </div>
    );
}
