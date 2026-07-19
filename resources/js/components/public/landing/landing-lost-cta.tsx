import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';

export function LandingLostCta() {
    const { t } = useTranslation('welcome');

    return (
        <section className="border-b border-border/50 bg-background py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal from="scale">
                    <div className="relative overflow-hidden rounded-[2rem] bg-[#0A1A24] px-6 py-14 text-white md:px-14 md:py-20">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -right-16 -bottom-20 size-80 rounded-full bg-[var(--brand-coral)]/25 blur-3xl"
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-10 left-1/3 size-64 rounded-full bg-brand-sky/30 blur-3xl"
                        />

                        <div className="relative max-w-2xl">
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-coral)]">
                                <AlertTriangle className="size-4" />
                                {t('lost_cta.eyebrow')}
                            </span>
                            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
                                {t('lost_cta.title')}
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
                                {t('lost_cta.subtitle')}
                            </p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 cursor-pointer rounded-2xl bg-red-600 px-6 text-white hover:bg-red-600/90"
                                >
                                    <Link href="/perdidos">
                                        {t('lost_cta.cta')}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 cursor-pointer rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                                >
                                    <Link href="/buscar">
                                        {t('lost_cta.search')}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
