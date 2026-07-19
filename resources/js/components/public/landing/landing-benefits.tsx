import { useTranslation } from 'react-i18next';
import { Parallax, Reveal } from '@/components/public/motion/reveal';

const BENEFITS = [
    'identity',
    'reunion',
    'travel',
    'clinic',
    'law',
    'privacy',
] as const;

export function LandingBenefits() {
    const { t } = useTranslation('welcome');

    return (
        <section
            id="beneficios"
            className="scroll-mt-24 border-b border-border/50 bg-brand-sky-soft/30 py-20 md:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                    <div>
                        <Reveal>
                            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                                {t('benefits.title')}
                            </h2>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                {t('benefits.subtitle')}
                            </p>
                        </Reveal>

                        <ul className="mt-12 grid gap-7 sm:grid-cols-2">
                            {BENEFITS.map((key, index) => (
                                <Reveal
                                    key={key}
                                    as="li"
                                    delay={index * 70}
                                    from="up"
                                >
                                    <h3 className="font-display text-lg font-semibold text-foreground">
                                        {t(`benefits.items.${key}.title`)}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {t(`benefits.items.${key}.body`)}
                                    </p>
                                </Reveal>
                            ))}
                        </ul>
                    </div>

                    <Reveal from="right" delay={120}>
                        <Parallax speed={0.14} className="rounded-[2rem]">
                            <figure className="landing-media relative overflow-hidden rounded-[2rem]">
                                <img
                                    src="/images/landing-microchip.jpg"
                                    alt={t('benefits.image_alt')}
                                    className="aspect-[4/3] w-full scale-110 object-cover lg:aspect-[3/4] lg:min-h-[32rem]"
                                />
                                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1A24] to-transparent px-6 pb-6 pt-20 text-sm text-white/90">
                                    {t('benefits.caption')}
                                </figcaption>
                            </figure>
                        </Parallax>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
