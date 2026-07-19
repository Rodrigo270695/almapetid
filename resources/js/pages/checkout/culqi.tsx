import { Head, Link, router, setLayoutProps, usePage } from '@inertiajs/react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { index as animalsIndex } from '@/routes/animals';

type CulqiCheckoutPageProps = {
    payment: {
        id: number;
        amount: number;
        currency: string;
        plan_name: string | null;
        email: string;
    };
    culqi: {
        enabled: boolean;
        publicKey: string;
        checkoutScriptUrl: string;
        commerceName: string;
    };
};

type CulqiWindow = Window & {
    Culqi?: {
        publicKey?: string;
        token?: { id?: string };
        error?: { user_message?: string };
        settings?: (config: unknown) => void;
        options?: (config: unknown) => void;
        open?: () => void;
        close?: () => void;
    };
    CulqiCheckout?: new (
        publicKey: string,
        config: unknown,
    ) => {
        open: () => void;
        close?: () => void;
        token?: { id?: string };
        error?: { user_message?: string };
        culqi?: () => void;
    };
    culqi?: () => void;
};

function closeCulqiModal(instance?: { close?: () => void } | null): void {
    try {
        instance?.close?.();
    } catch {
        // ignore
    }

    try {
        (window as CulqiWindow).Culqi?.close?.();
    } catch {
        // ignore
    }

    // Respaldo: algunos builds de Checkout dejan el overlay pegado tras Inertia.
    document
        .querySelectorAll(
            '[class*="culqi"], [id*="culqi"], iframe[src*="culqi"]',
        )
        .forEach((el) => {
            const root =
                el.closest('[class*="culqi"]') ??
                el.parentElement ??
                el;
            if (root instanceof HTMLElement && root !== document.body) {
                root.style.display = 'none';
            }
        });
}

function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function CulqiCheckoutPage() {
    const { payment, culqi } = usePage<CulqiCheckoutPageProps>().props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amountCents = useMemo(
        () => Math.round((payment.amount ?? 0) * 100),
        [payment.amount],
    );

    setLayoutProps({
        breadcrumbs: [
            { title: 'Mis mascotas', href: animalsIndex() },
            { title: 'Pagar con Culqi', href: `/checkout/culqi/${payment.id}` },
        ],
    });

    const submitCharge = (
        tokenId: string,
        instance?: { close?: () => void } | null,
    ) => {
        closeCulqiModal(instance);
        setLoading(true);

        router.post(
            `/checkout/culqi/${payment.id}/charge`,
            { token_id: tokenId },
            {
                preserveScroll: true,
                onFinish: () => setLoading(false),
                onError: () => {
                    setError('No se pudo confirmar el cobro.');
                    setLoading(false);
                },
            },
        );
    };

    const openCulqiCheckout = async () => {
        setError(null);
        if (!culqi.enabled) {
            setError(
                'Culqi no está configurado. Revisa CULQI_PUBLIC_KEY y CULQI_SECRET_KEY.',
            );
            return;
        }

        setLoading(true);

        try {
            const existingScript = document.querySelector<HTMLScriptElement>(
                `script[src="${culqi.checkoutScriptUrl}"]`,
            );

            if (!existingScript) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = culqi.checkoutScriptUrl;
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () =>
                        reject(new Error('No se pudo cargar el script de Culqi.'));
                    document.body.appendChild(script);
                });
            }

            const config = {
                settings: {
                    title: culqi.commerceName || 'AlmaPet ID',
                    currency: payment.currency,
                    amount: amountCents,
                },
                client: {
                    email: payment.email,
                },
                options: {
                    lang: 'es',
                    installments: true,
                    paymentMethods: {
                        tarjeta: true,
                        yape: true,
                        billetera: true,
                        bancaMovil: true,
                        agente: true,
                        cuotealo: true,
                    },
                },
            };

            const culqiWindow = window as CulqiWindow;

            if (culqiWindow.Culqi?.open) {
                culqiWindow.Culqi.publicKey = culqi.publicKey;
                culqiWindow.Culqi.settings?.(config.settings);
                culqiWindow.Culqi.options?.(config.options);

                culqiWindow.culqi = () => {
                    if (culqiWindow.Culqi?.token?.id) {
                        submitCharge(culqiWindow.Culqi.token.id, culqiWindow.Culqi);
                        return;
                    }

                    closeCulqiModal(culqiWindow.Culqi);
                    setError(
                        culqiWindow.Culqi?.error?.user_message ??
                            'No se pudo generar el token de pago.',
                    );
                    setLoading(false);
                };

                culqiWindow.Culqi.open();
                setLoading(false);
                return;
            }

            if (culqiWindow.CulqiCheckout) {
                const instance = new culqiWindow.CulqiCheckout(
                    culqi.publicKey,
                    config,
                );

                instance.culqi = () => {
                    if (instance.token?.id) {
                        submitCharge(instance.token.id, instance);
                        return;
                    }

                    closeCulqiModal(instance);
                    setError(
                        instance.error?.user_message ??
                            'No se pudo generar el token de pago.',
                    );
                    setLoading(false);
                };

                instance.open();
                setLoading(false);
                return;
            }

            throw new Error('La librería de Culqi no está disponible.');
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Error inesperado al abrir Culqi.',
            );
            setLoading(false);
        }
    };

    return (
        <>
            <Head title={`Pagar · ${payment.plan_name ?? 'AlmaPet'}`} />
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                        <CreditCard className="size-5" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Pagar con Culqi
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {payment.plan_name
                            ? `Plan: ${payment.plan_name}. `
                            : ''}
                        Se abrirá Culqi Checkout para tokenizar tu medio de pago.
                    </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/40 p-5">
                    <p className="text-sm text-muted-foreground">Monto</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {formatMoney(payment.amount, payment.currency)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Pago #{payment.id} · {payment.email}
                    </p>

                    {error ? (
                        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild className="cursor-pointer">
                            <Link href={animalsIndex()}>Cancelar</Link>
                        </Button>
                        <Button
                            type="button"
                            onClick={openCulqiCheckout}
                            disabled={loading || !culqi.enabled}
                            className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <CreditCard className="size-4" />
                            )}
                            Pagar ahora
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
