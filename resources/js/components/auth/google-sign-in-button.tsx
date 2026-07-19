import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { redirect as googleRedirect } from '@/routes/auth/google';

const AUTH_MESSAGE = 'almapet-google-auth';

type GoogleAuthMessage = {
    type: string;
    status: 'success' | 'error';
    redirect?: string;
    message?: string | null;
};

function GoogleMark({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

type Props = {
    onError?: (message: string) => void;
    className?: string;
};

/**
 * Abre Google OAuth en una ventana emergente centrada (misma UX que GIS/popup).
 */
export default function GoogleSignInButton({ onError, className }: Props) {
    const { t } = useTranslation('auth');
    const [pending, setPending] = useState(false);

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            const data = event.data as GoogleAuthMessage | null;

            if (! data || data.type !== AUTH_MESSAGE) {
                return;
            }

            setPending(false);

            if (data.status === 'success' && data.redirect) {
                window.location.assign(data.redirect);

                return;
            }

            onError?.(
                data.message ||
                    t('login.google_error', {
                        defaultValue:
                            'No pudimos iniciar sesión con Google. Intenta de nuevo.',
                    }),
            );
        },
        [onError, t],
    );

    useEffect(() => {
        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    const openPopup = () => {
        const width = 520;
        const height = 680;
        const left = Math.max(
            0,
            Math.round(window.screenX + (window.outerWidth - width) / 2),
        );
        const top = Math.max(
            0,
            Math.round(window.screenY + (window.outerHeight - height) / 2),
        );

        const url = googleRedirect.url({ query: { popup: 1 } });
        const popup = window.open(
            url,
            'almapet-google-auth',
            `popup=yes,width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
        );

        if (! popup) {
            // Bloqueado: fallback a redirect completo
            window.location.assign(url);

            return;
        }

        setPending(true);
        popup.focus();

        const timer = window.setInterval(() => {
            if (popup.closed) {
                window.clearInterval(timer);
                setPending(false);
            }
        }, 500);
    };

    return (
        <button
            type="button"
            onClick={openPopup}
            disabled={pending}
            className={cn(
                'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-background/60 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition-all duration-200',
                'hover:border-brand-sky/40 hover:bg-background/85 hover:shadow-md',
                'active:scale-[0.99] disabled:cursor-wait disabled:opacity-70',
                className,
            )}
        >
            {pending ? (
                <Spinner className="size-5" />
            ) : (
                <GoogleMark className="size-5 shrink-0" />
            )}
            {pending ? t('login.google_loading') : t('login.google')}
        </button>
    );
}
