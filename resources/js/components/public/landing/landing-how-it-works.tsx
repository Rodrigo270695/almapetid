import { QrCode, Search, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { cn } from '@/lib/utils';

const STEPS = [
    { key: 'register' as const, icon: ShieldCheck },
    { key: 'certify' as const, icon: QrCode },
    { key: 'recover' as const, icon: Search },
] as const;

type Props = { embedded?: boolean };

export function LandingHowItWorks({ embedded = false }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <section
            id={embedded ? undefined : 'como-funciona'}
            className="scroll-mt-24 border-b border-border/50 bg-background py-20 md:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                {!embedded ? (
                    <Reveal className="max-w-2xl">
                        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                            {t('how.title')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                            {t('how.subtitle')}
                        </p>
                    </Reveal>
                ) : null}

                <ol
                    className={cn(
                        'grid gap-10 md:grid-cols-3 md:gap-8',
                        embedded ? 'mt-0' : 'mt-14',
                    )}
                >
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Reveal
                                key={step.key}
                                as="li"
                                delay={index * 110}
                                from="up"
                                className="relative"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                                        <Icon
                                            className="size-5"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    <span className="font-display text-sm font-semibold text-brand-sky">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
                                    {t(`how.steps.${step.key}.title`)}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                                    {t(`how.steps.${step.key}.body`)}
                                </p>
                            </Reveal>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
