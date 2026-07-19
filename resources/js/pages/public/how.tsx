import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { LandingBenefits } from '@/components/public/landing/landing-benefits';
import { LandingHowItWorks } from '@/components/public/landing/landing-how-it-works';
import { LandingJoinCta } from '@/components/public/landing/landing-join-cta';
import { PageHero } from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import { choose } from '@/routes/auth';

export default function PublicHowPage() {
    const { t } = useTranslation('welcome');

    return (
        <PublicLayout flushTop title={t('pages.how.title')}>
            <Head title={t('pages.how.title')} />
            <PageHero
                image="/images/landing-microchip.jpg"
                imageAlt={t('benefits.image_alt')}
                eyebrow={t('how.title')}
                title={t('pages.how.title')}
                subtitle={t('pages.how.subtitle')}
                chips={[
                    t('pages.chips.iso'),
                    t('pages.chips.peru'),
                    t('pages.chips.no_crypto'),
                ]}
                ctas={[
                    { label: t('magnet.cta_start'), href: choose() },
                    {
                        label: t('magnet.cta_pricing'),
                        href: '/precios',
                        variant: 'secondary',
                    },
                    {
                        label: t('magnet.cta_search'),
                        href: '/buscar',
                        variant: 'secondary',
                    },
                ]}
            />
            <LandingHowItWorks embedded />
            <LandingBenefits />
            <ClientMagnet />
            <LandingJoinCta />
        </PublicLayout>
    );
}
