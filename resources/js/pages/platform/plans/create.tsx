import { Head, setLayoutProps } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { index as plansIndex } from '@/routes/platform/plans';
import { PlanForm } from './components/plan-form';

export default function CreatePlan() {
    const { t } = useTranslation('plans');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Facturación', href: plansIndex() },
            { title: t('form.title_create'), href: '/platform/plans/create' },
        ],
    });

    return (
        <>
            <Head title={t('form.title_create')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                        <CreditCard className="size-5" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        {t('form.title_create')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('form.description_create')}
                    </p>
                </div>

                <PlanForm />
            </div>
        </>
    );
}
