import {
    HeartCrack,
    MapPinOff,
    PawPrint,
    Scale,
    ShieldAlert,
    UserX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { cn } from '@/lib/utils';

const CAUSES = [
    { key: 'abandonment' as const, icon: UserX },
    { key: 'lost' as const, icon: MapPinOff },
    { key: 'unregistered' as const, icon: PawPrint },
    { key: 'abuse' as const, icon: HeartCrack },
    { key: 'trafficking' as const, icon: ShieldAlert },
    { key: 'law' as const, icon: Scale },
] as const;

type Props = {
    /** Si true, omite el header (para páginas con PageHero). */
    embedded?: boolean;
};

export function LandingCauses({ embedded = false }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <section
            id={embedded ? undefined : 'por-que'}
            className={cn(
                'scroll-mt-24 border-b border-border/50 py-20 text-white md:py-28',
                embedded ? 'bg-[#0A1A24]' : 'bg-[#0A1A24]',
            )}
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                {!embedded ? (
                    <Reveal className="max-w-2xl">
                        <p className="text-sm font-medium tracking-wide text-[var(--brand-coral)] uppercase">
                            {t('causes.eyebrow')}
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance md:text-5xl">
                            {t('causes.title')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
                            {t('causes.subtitle')}
                        </p>
                    </Reveal>
                ) : null}

                <ul
                    className={cn(
                        'grid gap-8 sm:grid-cols-2 lg:grid-cols-3',
                        embedded ? 'mt-0' : 'mt-14',
                    )}
                >
                    {CAUSES.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Reveal
                                key={item.key}
                                as="li"
                                delay={index * 80}
                                from="blur"
                                className="border-b border-white/10 pb-7"
                            >
                                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-brand-sky">
                                    <Icon className="size-5" strokeWidth={2} />
                                </span>
                                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                                    {t(`causes.items.${item.key}.title`)}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/65 md:text-[15px]">
                                    {t(`causes.items.${item.key}.body`)}
                                </p>
                            </Reveal>
                        );
                    })}
                </ul>

                <Reveal delay={140} className="mt-14 max-w-2xl">
                    <p className="font-display text-2xl font-semibold tracking-tight text-balance md:text-4xl">
                        {t('causes.closing')}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
