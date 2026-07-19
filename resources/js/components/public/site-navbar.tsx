import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BrandWordmark from '@/components/brand-wordmark';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { useScrollY } from '@/hooks/use-scroll-y';
import { cn } from '@/lib/utils';
import { dashboard, home, login } from '@/routes';
import { choose } from '@/routes/auth';

const NAV_LINKS = [
    { href: '/por-que', key: 'why' as const },
    { href: '/como-funciona', key: 'how' as const },
    { href: '/precios', key: 'pricing' as const },
    { href: '/buscar', key: 'search' as const },
    { href: '/veterinarios', key: 'vets' as const },
    { href: '/perdidos', key: 'lost' as const },
] as const;

type Props = {
    /**
     * overlay = puede ir transparente sobre hero oscuro (home / páginas flush).
     * solid = siempre barra oscura legible.
     */
    variant?: 'overlay' | 'solid';
};

export function SiteNavbar({ variant = 'solid' }: Props) {
    const { t } = useTranslation('welcome');
    const page = usePage();
    const auth = page.props.auth as { user?: unknown };
    const currentPath = page.url.split('?')[0] ?? '/';
    const [open, setOpen] = useState(false);
    const scrollY = useScrollY();
    const scrolled = scrollY > 20;

    // Siempre contraste: overlay solo semitransparente sobre hero oscuro;
    // al scrollear o en solid → barra opaca.
    const solidBar = variant === 'solid' || scrolled || open;

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 text-white transition-[background,border,backdrop-filter,box-shadow] duration-300',
                solidBar
                    ? 'border-b border-white/10 bg-[#0A1A24]/95 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl'
                    : 'border-b border-transparent bg-[#0A1A24]/45 backdrop-blur-md',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[4.5rem] md:px-6 lg:px-8">
                <Link
                    href={home()}
                    className="shrink-0 cursor-pointer"
                    onClick={() => setOpen(false)}
                >
                    <BrandWordmark
                        variant="white"
                        className="h-8 md:h-9"
                        alt="AlmaPet ID"
                    />
                </Link>

                <nav className="hidden items-center gap-0.5 lg:flex">
                    {NAV_LINKS.map((link) => {
                        const active = currentPath === link.href;
                        return (
                            <Link
                                key={link.key}
                                href={link.href}
                                className={cn(
                                    'cursor-pointer rounded-full px-3.5 py-2 text-sm transition-colors',
                                    active
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {t(`nav.${link.key}`)}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    <LanguageSwitcher compact onDark />
                    {auth.user ? (
                        <Button
                            asChild
                            size="sm"
                            className="cursor-pointer rounded-full bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            <Link href={dashboard()}>{t('nav.dashboard')}</Link>
                        </Button>
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer rounded-full text-white hover:bg-white/10 hover:text-white"
                            >
                                <Link href={login()}>{t('nav.login')}</Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className="cursor-pointer rounded-full bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link href={choose()}>{t('nav.register')}</Link>
                            </Button>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10 md:hidden"
                    aria-expanded={open}
                    aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            <div
                className={cn(
                    'border-t border-white/10 bg-[#0A1A24]/98 backdrop-blur-xl md:hidden',
                    open ? 'block' : 'hidden',
                )}
            >
                <div className="flex flex-col gap-1 px-4 py-3">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.key}
                            href={link.href}
                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/90 hover:bg-white/10"
                            onClick={() => setOpen(false)}
                        >
                            {t(`nav.${link.key}`)}
                        </Link>
                    ))}
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                        <LanguageSwitcher compact onDark />
                        {auth.user ? (
                            <Button
                                asChild
                                size="sm"
                                className="cursor-pointer rounded-full bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link
                                    href={dashboard()}
                                    onClick={() => setOpen(false)}
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
                                >
                                    <Link
                                        href={login()}
                                        onClick={() => setOpen(false)}
                                    >
                                        {t('nav.login')}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="cursor-pointer rounded-full bg-brand-sky text-white hover:bg-brand-sky/90"
                                >
                                    <Link
                                        href={choose()}
                                        onClick={() => setOpen(false)}
                                    >
                                        {t('nav.register')}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
