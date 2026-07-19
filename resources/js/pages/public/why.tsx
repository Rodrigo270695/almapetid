import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { LandingCauses } from '@/components/public/landing/landing-causes';
import { LandingJoinCta } from '@/components/public/landing/landing-join-cta';
import { PageHero } from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import { choose } from '@/routes/auth';

export default function PublicWhyPage() {
    const { t } = useTranslation('welcome');

    return (
        <PublicLayout flushTop title={t('pages.why.title')}>
            <Head title={t('pages.why.title')} />
            <PageHero
                image="/images/landing-hero.jpg"
                eyebrow={t('causes.eyebrow')}
                title={t('pages.why.title')}
                subtitle={t('pages.why.subtitle')}
                chips={[
                    t('pages.chips.reunion'),
                    t('pages.chips.privacy'),
                    t('pages.chips.clinic'),
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
            <LandingCauses embedded />
            <ClientMagnet />
            <LandingJoinCta />
        </PublicLayout>
    );
}
