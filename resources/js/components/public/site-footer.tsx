import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import BrandWordmark from '@/components/brand-wordmark';
import { home } from '@/routes';

const LEGAL_LINKS = [
    { route: '/legal/privacidad', key: 'privacy' as const },
    { route: '/legal/terminos', key: 'terms' as const },
    { route: '/legal/cambios-y-devoluciones', key: 'returns' as const },
    { route: '/legal/cookies', key: 'cookies' as const },
    { route: '/legal/libro-de-reclamaciones', key: 'complaints' as const },
] as const;

const PRODUCT_LINKS = [
    { href: '/buscar', key: 'search' as const },
    { href: '/precios', key: 'pricing' as const },
    { href: '/como-funciona', key: 'how' as const },
    { href: '/veterinarios', key: 'vets' as const },
    { href: '/perdidos', key: 'lost' as const },
] as const;

export function SiteFooter() {
    const { t } = useTranslation('welcome');
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border/60 bg-[#0A1A24] text-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6 lg:px-8 lg:py-16">
                <div className="md:col-span-1">
                    <Link href={home()} className="inline-block cursor-pointer">
                        <BrandWordmark variant="white" className="h-8" />
                    </Link>
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
                        {t('footer.tagline')}
                    </p>
                    <Link
                        href="/veterinarios"
                        className="mt-5 inline-flex cursor-pointer text-sm font-medium text-brand-sky transition hover:text-white"
                    >
                        {t('footer.clinic_whatsapp_hint')}
                    </Link>
                </div>

                <div>
                    <p className="text-xs font-semibold tracking-wide text-white/45 uppercase">
                        {t('footer.product')}
                    </p>
                    <ul className="mt-3 space-y-2">
                        {PRODUCT_LINKS.map((link) => (
                            <li key={link.key}>
                                <Link
                                    href={link.href}
                                    className="cursor-pointer text-sm text-white/75 transition-colors hover:text-white"
                                >
                                    {t(`footer.links.${link.key}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="md:col-span-2">
                    <p className="text-xs font-semibold tracking-wide text-white/45 uppercase">
                        {t('footer.legal')}
                    </p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {LEGAL_LINKS.map((link) => (
                            <li key={link.key}>
                                <Link
                                    href={link.route}
                                    className="cursor-pointer text-sm text-white/75 transition-colors hover:text-white"
                                >
                                    {t(`footer.links.${link.key}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
                    <p>
                        © {year} AlmaPet ID. {t('footer.rights')}
                    </p>
                    <p>{t('footer.chip_note')}</p>
                </div>
            </div>
        </footer>
    );
}
