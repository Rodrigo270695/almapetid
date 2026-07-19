import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { LandingHero } from '@/components/public/landing/landing-hero';
import { LandingHub } from '@/components/public/landing/landing-hub';
import { LandingJoinCta } from '@/components/public/landing/landing-join-cta';
import {
    LandingNetwork,
    type PublicClinic,
    type PublicSponsor,
} from '@/components/public/landing/landing-network';
import { LandingTrust } from '@/components/public/landing/landing-trust';
import {
    PricingPlans,
    type PublicPlan,
} from '@/components/public/pricing-plans';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    plans?: PublicPlan[];
    sponsors?: PublicSponsor[];
    clinics?: PublicClinic[];
};

export default function Welcome({
    plans = [],
    sponsors = [],
    clinics = [],
}: Props) {
    const { t } = useTranslation('welcome');

    const cards = [
        {
            href: '/buscar',
            title: t('hub.cards.search.title'),
            body: t('hub.cards.search.body'),
            cta: t('hub.cards.search.cta'),
            accent: 'sky' as const,
        },
        {
            href: '/precios',
            title: t('hub.cards.pricing.title'),
            body: t('hub.cards.pricing.body'),
            cta: t('hub.cards.pricing.cta'),
            accent: 'coral' as const,
        },
        {
            href: '/como-funciona',
            title: t('hub.cards.how.title'),
            body: t('hub.cards.how.body'),
            cta: t('hub.cards.how.cta'),
            accent: 'sky' as const,
        },
        {
            href: '/por-que',
            title: t('hub.cards.why.title'),
            body: t('hub.cards.why.body'),
            cta: t('hub.cards.why.cta'),
            accent: 'dark' as const,
        },
        {
            href: '/veterinarios',
            title: t('hub.cards.vets.title'),
            body: t('hub.cards.vets.body'),
            cta: t('hub.cards.vets.cta'),
            accent: 'sky' as const,
        },
        {
            href: '/perdidos',
            title: t('hub.cards.lost.title'),
            body: t('hub.cards.lost.body'),
            cta: t('hub.cards.lost.cta'),
            accent: 'dark' as const,
        },
    ];

    return (
        <PublicLayout flushTop>
            <LandingHero />
            <LandingHub cards={cards} />
            <LandingNetwork sponsors={sponsors} clinics={clinics} />
            <PricingPlans plans={plans} />
            <ClientMagnet />
            <LandingJoinCta />
            <LandingTrust />
        </PublicLayout>
    );
}
