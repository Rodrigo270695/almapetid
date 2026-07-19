import { Link } from '@inertiajs/react';
import { Building2, GraduationCap, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Parallax, Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register as clinicRegister } from '@/routes/clinic';

const STEPS = [
    { key: 'entity' as const, icon: Building2 },
    { key: 'network' as const, icon: Stethoscope },
    { key: 'ready' as const, icon: GraduationCap },
] as const;

type Props = { embedded?: boolean };

export function LandingVets({ embedded = false }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <section
            id={embedded ? undefined : 'veterinarios'}
            className="scroll-mt-24 border-b border-border/50 bg-background py-20 md:py-28"
        >
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-6 lg:px-8">
                <Reveal from="left">
                    <Parallax speed={0.12} className="rounded-[2rem]">
                        <div className="landing-media relative overflow-hidden rounded-[2rem]">
                            <img
                                src="/images/landing-vet.jpg"
                                alt={t('vets.image_alt')}
                                className="aspect-[4/3] w-full scale-110 object-cover"
                            />
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1A24]/45 to-transparent"
                            />
                        </div>
                    </Parallax>
                </Reveal>

                <div>
                    {!embedded ? (
                        <Reveal>
                            <p className="text-sm font-medium tracking-wide text-brand-sky uppercase">
                                {t('vets.eyebrow')}
                            </p>
                            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                                {t('vets.title')}
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                                {t('vets.subtitle')}
                            </p>
                        </Reveal>
                    ) : null}

                    <ol className={cn('space-y-6', embedded ? 'mt-0' : 'mt-9')}>
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <Reveal
                                    key={step.key}
                                    as="li"
                                    delay={index * 100}
                                    className="flex gap-4"
                                >
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                                        <Icon
                                            className="size-5"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-brand-sky uppercase">
                                            {t('vets.step_label', {
                                                n: index + 1,
                                            })}
                                        </p>
                                        <h3 className="mt-0.5 font-display text-lg font-semibold text-foreground md:text-xl">
                                            {t(`vets.steps.${step.key}.title`)}
                                        </h3>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            {t(`vets.steps.${step.key}.body`)}
                                        </p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </ol>

                    <Reveal delay={220}>
                        <Button
                            asChild
                            size="lg"
                            className="mt-9 h-12 cursor-pointer rounded-2xl bg-brand-sky px-6 text-white hover:bg-brand-sky/90"
                        >
                            <Link href={clinicRegister()}>{t('vets.cta')}</Link>
                        </Button>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
