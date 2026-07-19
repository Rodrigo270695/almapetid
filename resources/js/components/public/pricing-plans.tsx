import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { choose } from '@/routes/auth';

export type PublicPlan = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    billing_period: string;
    duration_months: number | null;
    amount: number | string;
    currency: string;
    is_default: boolean;
};

type Props = {
    plans: PublicPlan[];
    embedded?: boolean;
};

function formatMoney(amount: number | string, currency: string): string {
    const value = typeof amount === 'string' ? Number(amount) : amount;
    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency || 'PEN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `S/ ${value}`;
    }
}

/**
 * Precios públicos del fee de registro AlmaPet ID (contrato del servicio).
 */
export function PricingPlans({ plans, embedded = false }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <section
            id={embedded ? undefined : 'precios'}
            className="scroll-mt-24 border-b border-border/50 bg-background py-20 md:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                {!embedded ? (
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium tracking-wide text-brand-sky uppercase">
                            {t('pricing.eyebrow')}
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                            {t('pricing.title')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                            {t('pricing.subtitle')}
                        </p>
                    </Reveal>
                ) : null}

                {plans.length === 0 ? (
                    <p className="mt-10 text-center text-sm text-muted-foreground">
                        {t('pricing.empty')}
                    </p>
                ) : (
                    <div
                        className={cn(
                            'mx-auto grid max-w-4xl gap-6 md:grid-cols-2',
                            embedded ? 'mt-0' : 'mt-12',
                        )}
                    >
                        {plans.map((plan, index) => {
                            const featured = plan.is_default;
                            return (
                                <Reveal
                                    key={plan.id}
                                    delay={index * 100}
                                    from="up"
                                >
                                    <article
                                        className={cn(
                                            'flex h-full flex-col rounded-[1.75rem] border p-6 md:p-8',
                                            featured
                                                ? 'border-brand-sky/40 bg-brand-sky-soft/50 shadow-[0_24px_50px_-30px_rgba(0,90,120,0.45)]'
                                                : 'border-border/70 bg-card/80',
                                        )}
                                    >
                                        {featured ? (
                                            <span className="mb-3 w-fit rounded-full bg-brand-sky px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
                                                {t('pricing.featured')}
                                            </span>
                                        ) : (
                                            <span className="mb-3 h-5" />
                                        )}
                                        <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                                            {plan.name}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {plan.description ??
                                                t('pricing.fallback_desc')}
                                        </p>
                                        <p className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground">
                                            {formatMoney(
                                                plan.amount,
                                                plan.currency,
                                            )}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {plan.billing_period === 'annual'
                                                ? t('pricing.period_annual', {
                                                      months:
                                                          plan.duration_months ??
                                                          12,
                                                  })
                                                : t('pricing.period_once')}
                                        </p>
                                        <ul className="mt-6 space-y-2.5 text-sm text-foreground/90">
                                            {(
                                                [
                                                    'inc_cert',
                                                    'inc_profile',
                                                    'inc_lost',
                                                ] as const
                                            ).map((key) => (
                                                <li
                                                    key={key}
                                                    className="flex gap-2"
                                                >
                                                    <Check className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                                                    <span>
                                                        {t(
                                                            `pricing.includes.${key}`,
                                                        )}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            asChild
                                            className={cn(
                                                'mt-8 h-11 cursor-pointer rounded-2xl',
                                                featured
                                                    ? 'bg-brand-sky text-white hover:bg-brand-sky/90'
                                                    : 'bg-foreground text-background hover:bg-foreground/90',
                                            )}
                                        >
                                            <Link href={choose()}>
                                                {t('pricing.cta')}
                                            </Link>
                                        </Button>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                )}

                <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
                    {t('pricing.note')}
                </p>
            </div>
        </section>
    );
}
