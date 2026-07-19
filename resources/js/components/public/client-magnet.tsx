import { Link } from '@inertiajs/react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { choose } from '@/routes/auth';

/** Conversión dueño: fee de registro / contrato del servicio (sin WhatsApp). */
export function ClientMagnet() {
    const { t } = useTranslation('welcome');

    return (
        <section className="border-b border-border/50 bg-background py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal from="scale">
                    <div className="relative overflow-hidden rounded-[2rem] border border-brand-sky/20 bg-[#0A1A24] px-6 py-12 text-white md:px-12 md:py-14">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-brand-sky/30 blur-3xl"
                        />
                        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                            <div>
                                <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-coral)]">
                                    <Sparkles className="size-4" />
                                    {t('magnet.eyebrow')}
                                </p>
                                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                                    {t('magnet.title')}
                                </h2>
                                <p className="mt-3 max-w-xl text-white/70">
                                    {t('magnet.subtitle')}
                                </p>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 cursor-pointer rounded-2xl bg-white px-6 text-[#0A1A24] hover:bg-white/90"
                                    >
                                        <Link href={choose()}>
                                            {t('magnet.cta_start')}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 cursor-pointer rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                                    >
                                        <Link href="/precios">
                                            {t('magnet.cta_pricing')}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 cursor-pointer rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                                    >
                                        <Link href="/buscar">
                                            {t('magnet.cta_search')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <ul className="space-y-4">
                                {(['a', 'b', 'c'] as const).map((key, index) => (
                                    <Reveal
                                        key={key}
                                        as="li"
                                        delay={index * 90}
                                        className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                                    >
                                        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-sky" />
                                        <div>
                                            <p className="font-medium">
                                                {t(`magnet.points.${key}.title`)}
                                            </p>
                                            <p className="mt-0.5 text-sm text-white/65">
                                                {t(`magnet.points.${key}.body`)}
                                            </p>
                                        </div>
                                    </Reveal>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
