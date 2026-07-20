import { Head, router } from '@inertiajs/react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    payment: {
        id: number;
        amount: number;
        currency: string;
        channel: string;
        platform_amount: number;
        clinic_commission: number;
        plan_name: string | null;
        email: string;
        clinic_name: string | null;
        animal_name: string | null;
        microchip: string | null;
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
}

function money(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function HandoffCheckout({ payment, culqi }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const amountCents = useMemo(
        () => Math.round((payment.amount ?? 0) * 100),
        [payment.amount],
    );

    const submitCharge = (
        tokenId: string,
        instance?: { close?: () => void } | null,
    ) => {
        closeCulqiModal(instance);
        setLoading(true);
        router.post(
            `/handoff/pago/${payment.id}/charge`,
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
            setError('Culqi no está configurado en el servidor.');
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
                        reject(new Error('No se pudo cargar Culqi.'));
                    document.body.appendChild(script);
                });
            }

            const config = {
                settings: {
                    title: culqi.commerceName || 'AlmaPet ID',
                    currency: payment.currency,
                    amount: amountCents,
                },
                client: { email: payment.email },
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

            const w = window as CulqiWindow;
            if (w.Culqi?.open) {
                w.Culqi.publicKey = culqi.publicKey;
                w.Culqi.settings?.(config.settings);
                w.Culqi.options?.(config.options);
                w.culqi = () => {
                    if (w.Culqi?.token?.id) {
                        submitCharge(w.Culqi.token.id, w.Culqi);
                        return;
                    }
                    closeCulqiModal(w.Culqi);
                    setError(
                        w.Culqi?.error?.user_message ??
                            'No se pudo generar el token de pago.',
                    );
                    setLoading(false);
                };
                w.Culqi.open();
                setLoading(false);
                return;
            }

            if (w.CulqiCheckout) {
                const instance = new w.CulqiCheckout(culqi.publicKey, config);
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
                e instanceof Error ? e.message : 'Error al abrir Culqi.',
            );
            setLoading(false);
        }
    };

    return (
        <PublicLayout title="Pagar registro AlmaPet ID">
            <Head title="Pagar registro AlmaPet ID" />
            <div className="mx-auto w-full max-w-lg px-4 py-12 md:py-16">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-cyan-700 uppercase dark:text-cyan-300">
                    Pago · convenio VetSaaS
                </p>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                    Completar pago
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {payment.animal_name ?? 'Mascota'}
                    {payment.clinic_name ? ` · ${payment.clinic_name}` : ''}
                </p>

                <div className="mt-8 rounded-2xl border border-border/70 bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        {payment.plan_name ?? 'Fee de registro'}
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                        {money(payment.amount, payment.currency)}
                    </p>
                    {payment.clinic_commission > 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                            AlmaPet{' '}
                            {money(payment.platform_amount, payment.currency)}
                            {' · '}
                            Clínica{' '}
                            {money(payment.clinic_commission, payment.currency)}
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Precio especial por convenio VetSaaS.
                        </p>
                    )}
                    {payment.microchip ? (
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                            Chip {payment.microchip}
                        </p>
                    ) : null}

                    {error ? (
                        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    ) : null}

                    <Button
                        type="button"
                        className="mt-6 w-full gap-2"
                        disabled={loading || !culqi.enabled}
                        onClick={openCulqiCheckout}
                    >
                        {loading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <CreditCard className="size-4" />
                        )}
                        Pagar con Culqi
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
