import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';

export function LandingTrust() {
    const { t } = useTranslation('welcome');

    return (
        <section className="bg-background py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal>
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                        {t('trust.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                        {t('trust.subtitle')}
                    </p>
                </Reveal>
                <ul className="mt-12 grid gap-8 sm:grid-cols-3">
                    {(['privacy', 'no_gps', 'no_crypto'] as const).map(
                        (key, index) => (
                            <Reveal
                                key={key}
                                as="li"
                                delay={index * 90}
                                from="up"
                            >
                                <p className="font-display text-xl font-semibold text-foreground">
                                    {t(`trust.items.${key}.title`)}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                                    {t(`trust.items.${key}.body`)}
                                </p>
                            </Reveal>
                        ),
                    )}
                </ul>
            </div>
        </section>
    );
}
