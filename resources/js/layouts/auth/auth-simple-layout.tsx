import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import BrandWordmark from '@/components/brand-wordmark';
import { AppearanceToggle } from '@/components/appearance-toggle';
import AuthGlassCard from '@/components/auth/auth-glass-card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;
    const { t } = useTranslation('auth');
    const brand =
        typeof name === 'string' && name.length > 0 ? name : 'AlmaPet ID';

    return (
        <div className="auth-atmosphere relative flex min-h-svh">
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1 md:top-6 md:right-6">
                <AppearanceToggle />
                <LanguageSwitcher />
            </div>

            <aside className="auth-panel-atmosphere relative hidden w-[46%] flex-col justify-between overflow-hidden p-10 text-[var(--auth-panel-fg)] lg:flex xl:p-14">
                <Link
                    href={home()}
                    className="relative z-10 flex cursor-pointer items-center gap-3.5 transition-opacity hover:opacity-90"
                >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-coral)]/20 ring-1 ring-[var(--brand-coral)]/35">
                        <AppLogoIcon className="size-9 object-contain drop-shadow-[0_0_1.5px_rgba(255,255,255,0.95)] drop-shadow-[0_1px_8px_rgba(255,255,255,0.75)]" />
                    </span>
                    <BrandWordmark className="h-10" variant="white" alt={brand} />
                </Link>

                <div className="relative z-10 max-w-md space-y-5">
                    <p className="font-display text-4xl leading-[1.15] font-semibold tracking-tight xl:text-5xl">
                        {t('brand.panel_headline')}
                    </p>
                    <p className="max-w-sm text-base leading-relaxed text-[var(--auth-panel-muted)]">
                        {t('brand.panel_body')}
                    </p>
                    <div
                        className="h-1.5 w-16 rounded-full bg-[var(--brand-coral)]"
                        aria-hidden
                    />
                </div>

                <p className="relative z-10 text-xs tracking-wide text-[var(--auth-panel-muted)] uppercase">
                    {t('brand.panel_footer')}
                </p>
            </aside>

            <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-10 sm:py-14">
                <div className="mx-auto flex w-full max-w-[640px] justify-center">
                    <AuthGlassCard>
                        <div className="mb-7 flex flex-col items-center gap-3 text-center">
                            <Link
                                href={home()}
                                className="mb-1 flex cursor-pointer items-center gap-2.5 lg:hidden"
                            >
                                <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-sky-soft/90 ring-1 ring-brand-sky/25">
                                    <AppLogoIcon className="size-5 object-contain" />
                                </span>
                                <BrandWordmark
                                    className="h-6"
                                    variant="sky"
                                    alt={brand}
                                />
                            </Link>

                            <div className="auth-vt-copy w-full space-y-1.5">
                                <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-tight text-foreground sm:text-[1.9rem]">
                                    {title}
                                </h1>
                                {description ? (
                                    <p className="mx-auto max-w-[26rem] text-sm leading-relaxed text-muted-foreground text-balance">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="auth-vt-body">{children}</div>
                    </AuthGlassCard>
                </div>
            </main>
        </div>
    );
}
