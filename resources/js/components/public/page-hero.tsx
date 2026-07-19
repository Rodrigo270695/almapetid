import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import { choose } from '@/routes/auth';

type Cta = {
    label: string;
    href?: string;
    whatsapp?: boolean;
    variant?: 'primary' | 'secondary' | 'whatsapp';
};

type PageHeroProps = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Imagen full-bleed (hero real). */
    image?: string;
    imageAlt?: string;
    className?: string;
    children?: ReactNode;
    ctas?: Cta[];
    /** Chips de confianza / prueba social. */
    chips?: string[];
};

/**
 * Hero de páginas internas: full-bleed oscuro + foto + CTAs.
 * Pensado para ir bajo el navbar (flushTop).
 */
export function PageHero({
    eyebrow,
    title,
    subtitle,
    image = '/images/landing-hero.jpg',
    imageAlt = '',
    className,
    children,
    ctas,
    chips,
}: PageHeroProps) {
    return (
        <header
            className={cn(
                'relative isolate min-h-[72svh] overflow-hidden bg-[#0A1A24] text-white md:min-h-[78svh]',
                className,
            )}
        >
            <div className="absolute inset-0">
                <img
                    src={image}
                    alt={imageAlt}
                    className="size-full object-cover object-center landing-hero-img"
                />
            </div>
            <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[#0A1A24] via-[#0A1A24]/85 to-[#0A1A24]/35"
            />
            <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0A1A24] via-transparent to-[#0A1A24]/55"
            />

            <div className="relative mx-auto flex min-h-[72svh] max-w-7xl flex-col justify-end px-4 pb-14 pt-28 md:min-h-[78svh] md:justify-center md:px-6 md:pb-20 md:pt-32 lg:px-8">
                <Reveal className="max-w-2xl" from="blur">
                    {eyebrow ? (
                        <p className="text-sm font-medium tracking-[0.18em] text-[var(--brand-coral)] uppercase">
                            {eyebrow}
                        </p>
                    ) : null}
                    <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                            {subtitle}
                        </p>
                    ) : null}

                    {chips && chips.length > 0 ? (
                        <ul className="mt-6 flex flex-wrap gap-2">
                            {chips.map((chip) => (
                                <li
                                    key={chip}
                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur-sm"
                                >
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {ctas && ctas.length > 0 ? (
                        <div className="mt-8 flex flex-wrap gap-3">
                            {ctas.map((cta) => {
                                if (cta.whatsapp || cta.variant === 'whatsapp') {
                                    return (
                                        <Button
                                            key={cta.label}
                                            asChild
                                            size="lg"
                                            className="h-12 cursor-pointer rounded-2xl bg-[#25D366] px-6 text-white hover:bg-[#1ebe57]"
                                        >
                                            <a
                                                href={whatsappUrl()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {cta.label}
                                            </a>
                                        </Button>
                                    );
                                }

                                const href = cta.href ?? choose();
                                const primary = cta.variant !== 'secondary';

                                return (
                                    <Button
                                        key={cta.label}
                                        asChild
                                        size="lg"
                                        variant={primary ? 'default' : 'outline'}
                                        className={
                                            primary
                                                ? 'h-12 cursor-pointer rounded-2xl bg-white px-6 text-[#0A1A24] hover:bg-white/90'
                                                : 'h-12 cursor-pointer rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white'
                                        }
                                    >
                                        <Link href={href}>{cta.label}</Link>
                                    </Button>
                                );
                            })}
                        </div>
                    ) : null}

                    {children}
                </Reveal>
            </div>
        </header>
    );
}
