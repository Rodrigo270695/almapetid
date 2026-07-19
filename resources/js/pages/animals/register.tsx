import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { index as animalsIndex, register as animalsRegister } from '@/routes/animals';

type PlanRow = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    billing_period: string;
    amount: string;
    currency: string;
    is_default: boolean;
};

type Props = {
    plans: PlanRow[];
    culqi_enabled: boolean;
};

function formatMoney(amount: string, currency: string): string {
    const n = Number(amount);
    if (!Number.isFinite(n)) return `${currency} ${amount}`;
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

export default function AnimalsRegister({ plans, culqi_enabled }: Props) {
    const { t } = useTranslation('animals');
    const form = useForm({
        plan_id: plans.find((p) => p.is_default)?.id ?? plans[0]?.id ?? 0,
    });

    setLayoutProps({
        breadcrumbs: [
            { title: t('breadcrumb'), href: animalsIndex() },
            { title: t('register.title'), href: animalsRegister() },
        ],
    });

    const pay = () => {
        if (!form.data.plan_id) return;
        router.post('/checkout/culqi', { plan_id: form.data.plan_id });
    };

    return (
        <>
            <Head title={t('register.title')} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        {t('register.title')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('register.subtitle')}
                    </p>
                </div>

                {!culqi_enabled ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                        {t('register.culqi_disabled')}
                    </p>
                ) : null}

                <div className="space-y-3">
                    {plans.map((plan) => {
                        const selected = form.data.plan_id === plan.id;
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => form.setData('plan_id', plan.id)}
                                className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                                    selected
                                        ? 'border-brand-sky bg-brand-sky/8 ring-1 ring-brand-sky/40'
                                        : 'border-border/70 bg-card/40 hover:border-brand-sky/30'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{plan.name}</p>
                                        {plan.description ? (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {plan.description}
                                            </p>
                                        ) : null}
                                    </div>
                                    <p className="shrink-0 font-semibold tabular-nums">
                                        {formatMoney(plan.amount, plan.currency)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('register.no_plans')}
                    </p>
                ) : (
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={pay}
                            disabled={!culqi_enabled || !form.data.plan_id}
                            className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            <CreditCard className="size-4" />
                            {t('register.pay_cta')}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
