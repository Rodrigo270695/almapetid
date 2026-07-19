import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { cn } from '@/lib/utils';

type HubCard = {
    href: string;
    title: string;
    body: string;
    cta: string;
    accent?: 'sky' | 'dark' | 'coral';
};

/** Tarjetas del home que llevan a otras vistas del sitio. */
export function LandingHub({ cards }: { cards: HubCard[] }) {
    const { t } = useTranslation('welcome');

    return (
        <section className="border-b border-border/50 bg-background py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal className="max-w-2xl">
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                        {t('hub.title')}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                        {t('hub.subtitle')}
                    </p>
                </Reveal>

                <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card, index) => (
                        <Reveal
                            key={card.href}
                            delay={index * 80}
                            from="up"
                        >
                            <Link
                                href={card.href}
                                className={cn(
                                    'group flex h-full cursor-pointer flex-col rounded-[1.75rem] border p-6 no-underline transition duration-300 md:p-7',
                                    'hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-36px_rgba(0,70,100,0.45)]',
                                    card.accent === 'dark' &&
                                        'border-white/10 bg-[#0A1A24] text-white hover:border-white/20',
                                    card.accent === 'coral' &&
                                        'border-[var(--brand-coral)]/25 bg-[var(--brand-coral-soft)] text-foreground',
                                    (!card.accent || card.accent === 'sky') &&
                                        'border-brand-sky/20 bg-brand-sky-soft/50 text-foreground hover:border-brand-sky/40',
                                )}
                            >
                                <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                                    {card.title}
                                </h3>
                                <p
                                    className={cn(
                                        'mt-3 flex-1 text-sm leading-relaxed',
                                        card.accent === 'dark'
                                            ? 'text-white/70'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {card.body}
                                </p>
                                <span
                                    className={cn(
                                        'mt-6 inline-flex items-center gap-1.5 text-sm font-semibold',
                                        card.accent === 'dark'
                                            ? 'text-white'
                                            : 'text-brand-sky',
                                    )}
                                >
                                    {card.cta}
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
