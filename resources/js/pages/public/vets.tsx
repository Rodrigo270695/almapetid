import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ClinicWhatsAppFloat } from '@/components/public/clinic-whatsapp-float';
import { LandingJoinCta } from '@/components/public/landing/landing-join-cta';
import { LandingVets } from '@/components/public/landing/landing-vets';
import { PageHero } from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import { register as clinicRegister } from '@/routes/clinic';
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';

export default function PublicVetsPage() {
    const { t } = useTranslation('welcome');

    return (
        <PublicLayout flushTop title={t('pages.vets.title')}>
            <Head title={t('pages.vets.title')} />
            <PageHero
                image="/images/landing-vet.jpg"
                imageAlt={t('vets.image_alt')}
                eyebrow={t('vets.eyebrow')}
                title={t('pages.vets.title')}
                subtitle={t('pages.vets.subtitle')}
                chips={[
                    t('pages.chips.clinic'),
                    t('pages.chips.iso'),
                    t('pages.chips.no_crypto'),
                ]}
                ctas={[
                    {
                        label: t('vets.cta'),
                        href: clinicRegister(),
                    },
                    {
                        label: t('float.whatsapp_clinic'),
                        whatsapp: true,
                    },
                ]}
            />
            <LandingVets embedded />
            <section className="border-b border-border/50 bg-brand-sky-soft/30 py-14">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center md:px-6 lg:px-8">
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-foreground">
                            {t('vets.contact_title')}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('vets.contact_body', {
                                phone: WHATSAPP_DISPLAY,
                            })}
                        </p>
                    </div>
                    <Button
                        asChild
                        className="cursor-pointer rounded-2xl bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    >
                        <a
                            href={whatsappUrl(t('float.whatsapp_clinic_message'))}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('float.whatsapp_clinic')} · {WHATSAPP_DISPLAY}
                        </a>
                    </Button>
                </div>
            </section>
            <LandingJoinCta />
            <ClinicWhatsAppFloat />
        </PublicLayout>
    );
}
