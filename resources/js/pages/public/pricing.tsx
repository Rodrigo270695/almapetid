import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { PageHero } from '@/components/public/page-hero';
import {
    PricingPlans,
    type PublicPlan,
} from '@/components/public/pricing-plans';
import PublicLayout from '@/layouts/public-layout';
import { choose } from '@/routes/auth';

type Props = {
    plans: PublicPlan[];
};

export default function PublicPricingPage({ plans }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <PublicLayout flushTop title={t('pricing.title')}>
            <Head title={t('pricing.title')} />
            <PageHero
                image="/images/landing-microchip.jpg"
                eyebrow={t('pricing.eyebrow')}
                title={t('pricing.title')}
                subtitle={t('pricing.subtitle')}
                chips={[
                    t('pages.chips.iso'),
                    t('pages.chips.peru'),
                    t('pages.chips.no_crypto'),
                ]}
                ctas={[
                    { label: t('magnet.cta_start'), href: choose() },
                    {
                        label: t('magnet.cta_search'),
                        href: '/buscar',
                        variant: 'secondary',
                    },
                ]}
            />
            <PricingPlans plans={plans} embedded />
            <ClientMagnet />
        </PublicLayout>
    );
}
