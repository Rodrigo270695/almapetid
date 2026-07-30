import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    public_code: string;
    animal: {
        name: string | null;
        species: string | null;
        breed: string | null;
        sex: string | null;
    };
    microchip: string | null;
    clinic_name: string | null;
    pricing: {
        digital_amount: number;
        physical_amount: number;
        currency: string;
    };
    support_phone: string;
    culqi_ready: boolean;
    plan_id: number | null;
};

function money(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function ActivateShow({
    public_code,
    animal,
    microchip,
    clinic_name,
    pricing,
    support_phone,
    culqi_ready,
}: Props) {
    const [includePhysical, setIncludePhysical] = useState(false);
    const form = useForm({
        include_physical: false,
    });

    const total =
        pricing.digital_amount + (includePhysical ? pricing.physical_amount : 0);

    return (
        <PublicLayout title="Activar carnet AlmaPet ID">
            <Head title="Activar carnet digital" />
            <div className="mx-auto w-full max-w-xl px-4 py-12 md:py-16">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-cyan-700 uppercase dark:text-cyan-300">
                    Activación
                </p>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                    Activa el carnet de {animal.name ?? 'tu mascota'}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Tu clínica ({clinic_name ?? 'VetSaaS'}) ya registró el
                    microchip. Al pagar activas el carnet digital y la mascota
                    queda buscable en AlmaPet ID.
                </p>

                <dl className="mt-8 space-y-3 rounded-2xl border border-border/70 bg-card p-5 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Código</dt>
                        <dd className="font-mono">{public_code}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Microchip</dt>
                        <dd className="font-mono">{microchip ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Carnet digital</dt>
                        <dd className="font-semibold tabular-nums">
                            {money(pricing.digital_amount, pricing.currency)}
                        </dd>
                    </div>
                </dl>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 text-sm">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={includePhysical}
                        onChange={(e) => {
                            setIncludePhysical(e.target.checked);
                            form.setData('include_physical', e.target.checked);
                        }}
                    />
                    <span>
                        <span className="font-medium">Carnet físico</span>
                        <span className="mt-1 block text-muted-foreground">
                            +{money(pricing.physical_amount, pricing.currency)}{' '}
                            adicional (impresión y envío coordinados por
                            soporte).
                        </span>
                    </span>
                </label>

                <div className="mt-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 px-5 py-4">
                    <p className="text-sm text-muted-foreground">Total a pagar</p>
                    <p className="text-2xl font-semibold tabular-nums">
                        {money(total, pricing.currency)}
                    </p>
                </div>

                {!culqi_ready ? (
                    <p className="mt-4 text-sm text-destructive">
                        El pago no está disponible en este momento. Contacta
                        soporte: {support_phone}
                    </p>
                ) : (
                    <Button
                        className="mt-6 w-full"
                        disabled={form.processing}
                        onClick={() =>
                            form.post(`/activar/${public_code}/checkout`)
                        }
                    >
                        {form.processing ? 'Preparando pago…' : 'Pagar y activar'}
                    </Button>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Soporte AlmaPet: {support_phone}
                </p>
            </div>
        </PublicLayout>
    );
}
