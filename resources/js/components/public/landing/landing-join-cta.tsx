import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { choose } from '@/routes/auth';
import { register as clinicRegister } from '@/routes/clinic';

export function LandingJoinCta() {
    const { t } = useTranslation('welcome');

    return (
        <section
            id="unete"
            className="scroll-mt-24 border-b border-border/50 bg-background py-20 md:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal from="up">
                    <div className="relative overflow-hidden rounded-[2rem] border border-brand-sky/20 bg-gradient-to-br from-brand-sky-soft/80 via-background to-[var(--brand-coral-soft)] px-6 py-14 md:px-14 md:py-20">
                        <div className="max-w-2xl">
                            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                                {t('join.title')}
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                                {t('join.subtitle')}
                            </p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 cursor-pointer rounded-2xl bg-brand-sky px-6 text-white hover:bg-brand-sky/90"
                                >
                                    <Link href={choose()}>
                                        {t('join.cta_start')}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 cursor-pointer rounded-2xl border-brand-sky/35 bg-background/70 px-6 text-foreground hover:bg-background"
                                >
                                    <Link href={clinicRegister()}>
                                        {t('join.cta_clinic')}
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
