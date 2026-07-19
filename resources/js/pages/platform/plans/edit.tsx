import { Head, setLayoutProps } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { index as plansIndex } from '@/routes/platform/plans';
import { PlanForm } from './components/plan-form';
import type { Plan } from './types';

type EditPlanProps = {
    plan: Plan;
};

export default function EditPlan({ plan }: EditPlanProps) {
    const { t } = useTranslation('plans');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Facturación', href: plansIndex() },
            {
                title: t('form.title_edit'),
                href: `/platform/plans/${plan.id}/edit`,
            },
        ],
    });

    return (
        <>
            <Head title={t('form.title_edit')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                        <CreditCard className="size-5" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        {t('form.title_edit')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('form.description_edit')}
                    </p>
                </div>

                <PlanForm plan={plan} />
            </div>
        </>
    );
}
