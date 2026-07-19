import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { LandingAudiences } from '@/components/public/landing/landing-audiences';
import { LandingJoinCta } from '@/components/public/landing/landing-join-cta';
import { LandingLostCta } from '@/components/public/landing/landing-lost-cta';
import { PageHero } from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import { choose } from '@/routes/auth';

export default function PublicOwnersClinicsPage() {
    const { t } = useTranslation('welcome');

    return (
        <PublicLayout flushTop title={t('pages.audiences.title')}>
            <Head title={t('pages.audiences.title')} />
            <PageHero
                image="/images/landing-hero.jpg"
                eyebrow={t('audiences.title')}
                title={t('pages.audiences.title')}
                subtitle={t('pages.audiences.subtitle')}
                chips={[
                    t('pages.chips.reunion'),
                    t('pages.chips.privacy'),
                    t('pages.chips.peru'),
                ]}
                ctas={[
                    { label: t('magnet.cta_start'), href: choose() },
                    {
                        label: t('magnet.cta_pricing'),
                        href: '/precios',
                        variant: 'secondary',
                    },
                ]}
            />
            <LandingAudiences embedded />
            <LandingLostCta />
            <ClientMagnet />
            <LandingJoinCta />
        </PublicLayout>
    );
}
