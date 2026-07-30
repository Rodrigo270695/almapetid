import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Home,
    LayoutDashboard,
    Lock,
    PawPrint,
    SearchX,
    TriangleAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandWordmark from '@/components/brand-wordmark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

type HttpErrorPageProps = {
    status: 403 | 404 | 500 | 503;
    message?: string | null;
    attempted_path?: string | null;
    is_authenticated?: boolean;
};

export function HttpErrorPage({
    status,
    message = null,
    attempted_path = null,
    is_authenticated = false,
}: HttpErrorPageProps) {
    const { t } = useTranslation('common');

    const isForbidden = status === 403;
    const isServerError = status === 500 || status === 503;
    const Icon = isForbidden ? Lock : isServerError ? TriangleAlert : SearchX;

    const title = isForbidden
        ? t('http_errors.forbidden.title')
        : isServerError
          ? t('http_errors.server_error.title')
          : t('http_errors.not_found.title');

    const description = isForbidden
        ? t('http_errors.forbidden.description')
        : isServerError
          ? t('http_errors.server_error.description')
          : t('http_errors.not_found.description');

    const helper = isForbidden
        ? t('http_errors.forbidden.helper')
        : isServerError
          ? t('http_errors.server_error.helper')
          : t('http_errors.not_found.helper');

    return (
        <>
            <Head title={`${status} · ${title}`} />

            <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#F7F9FB] text-foreground dark:bg-[#0a0a0a]">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--brand-sky)_18%,transparent),_transparent_55%)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-sky/10 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-brand-coral/10 blur-3xl"
                />

                <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5 md:px-6">
                    <Link href={home()} className="inline-flex items-center gap-2">
                        <BrandWordmark variant="sky" className="h-8" />
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-sky/20 bg-brand-sky/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-sky uppercase">
                        <PawPrint className="size-3.5" />
                        AlmaPet ID
                    </span>
                </header>

                <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 pb-16 text-center md:px-6">
                    <p
                        className={cn(
                            'font-display text-[5.5rem] leading-none font-semibold tracking-tight sm:text-[7rem]',
                            isForbidden
                                ? 'text-amber-500/80'
                                : isServerError
                                  ? 'text-brand-coral/80'
                                  : 'text-brand-sky/70',
                        )}
                    >
                        {status}
                    </p>

                    <div
                        className={cn(
                            'mt-2 flex size-16 items-center justify-center rounded-2xl ring-1',
                            isForbidden
                                ? 'bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300'
                                : isServerError
                                  ? 'bg-brand-coral/10 text-brand-coral ring-brand-coral/25'
                                  : 'bg-brand-sky/10 text-brand-sky ring-brand-sky/25',
                        )}
                    >
                        <Icon className="size-7" aria-hidden />
                    </div>

                    <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {description}
                    </p>

                    <div className="mt-8 flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-3">
                        {is_authenticated ? (
                            <Button
                                asChild
                                size="lg"
                                className="gap-2 rounded-2xl bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard className="size-4" />
                                    {t('http_errors.cta_dashboard')}
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                asChild
                                size="lg"
                                className="gap-2 rounded-2xl bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link href={home()}>
                                    <Home className="size-4" />
                                    {t('http_errors.cta_home')}
                                </Link>
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="gap-2 rounded-2xl"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="size-4" />
                            {t('http_errors.cta_back')}
                        </Button>
                    </div>

                    {(message || attempted_path) && (
                        <div className="mt-8 w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-left text-xs text-muted-foreground backdrop-blur-sm sm:text-sm">
                            {attempted_path ? (
                                <p>
                                    <span className="font-medium text-foreground">
                                        {t('http_errors.attempted_path')}:
                                    </span>{' '}
                                    <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-foreground">
                                        {attempted_path}
                                    </code>
                                </p>
                            ) : null}
                            {message ? (
                                <p
                                    className={cn(
                                        'whitespace-pre-line text-foreground',
                                        attempted_path && 'mt-2',
                                    )}
                                >
                                    {message}
                                </p>
                            ) : null}
                        </div>
                    )}

                    <p className="mt-8 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {helper}
                    </p>
                </main>
            </div>
        </>
    );
}
