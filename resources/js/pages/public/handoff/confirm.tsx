import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Pricing = {
    amount: number;
    currency: string;
    platform_amount: number;
    clinic_commission: number;
    plan_name: string | null;
} | null;

type Props = {
    token: string;
    expires_at: string | null;
    clinic_name: string | null;
    animal: {
        name: string | null;
        species: string | null;
        breed: string | null;
    };
    owner_name: string;
    microchip: string | null;
    pricing: Pricing;
    culqi_ready: boolean;
};

function money(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function HandoffConfirm({
    token,
    clinic_name,
    animal,
    owner_name,
    microchip,
    pricing,
    culqi_ready,
}: Props) {
    const form = useForm({
        token,
        accept_terms: false as boolean,
    });

    return (
        <PublicLayout title="Confirmar registro AlmaPet ID">
            <Head title="Confirmar registro AlmaPet ID" />
            <div className="mx-auto w-full max-w-xl px-4 py-12 md:py-16">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-cyan-700 uppercase dark:text-cyan-300">
                    Handoff VetSaaS
                </p>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                    Registrar en AlmaPet ID
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Confirma los datos y paga el fee de registro (convenio
                    VetSaaS) para activar el certificado con QR.
                </p>

                <dl className="mt-8 space-y-3 rounded-2xl border border-border/70 bg-card p-5 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Clínica</dt>
                        <dd className="text-right font-medium">{clinic_name ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Mascota</dt>
                        <dd className="text-right font-medium">
                            {animal.name ?? '—'}
                            {animal.species ? (
                                <span className="block text-xs font-normal text-muted-foreground">
                                    {animal.species}
                                    {animal.breed ? ` · ${animal.breed}` : ''}
                                </span>
                            ) : null}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Titular</dt>
                        <dd className="text-right font-medium">{owner_name || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Microchip</dt>
                        <dd className="text-right font-mono tracking-wide">
                            {microchip ?? '—'}
                        </dd>
                    </div>
                </dl>

                {pricing ? (
                    <div className="mt-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 px-5 py-4 text-sm">
                        <p className="font-medium text-foreground">
                            {pricing.plan_name ?? 'Fee de registro'} · convenio
                            VetSaaS
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {money(pricing.amount, pricing.currency)}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            AlmaPet {money(pricing.platform_amount, pricing.currency)}
                            {' · '}
                            Clínica{' '}
                            {money(pricing.clinic_commission, pricing.currency)}
                        </p>
                    </div>
                ) : null}

                {!culqi_ready ? (
                    <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                        Culqi aún no está configurado en el servidor. No se puede
                        cobrar el registro.
                    </p>
                ) : null}

                <form
                    className="mt-8 space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/handoff');
                    }}
                >
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                        <input
                            type="checkbox"
                            className="mt-1 size-4 rounded border-border"
                            checked={form.data.accept_terms}
                            onChange={(e) =>
                                form.setData('accept_terms', e.target.checked)
                            }
                        />
                        <span>
                            Acepto los{' '}
                            <a
                                href="/terminos"
                                className="text-cyan-700 underline dark:text-cyan-300"
                            >
                                términos
                            </a>{' '}
                            y la{' '}
                            <a
                                href="/privacidad"
                                className="text-cyan-700 underline dark:text-cyan-300"
                            >
                                política de privacidad
                            </a>{' '}
                            de AlmaPet ID.
                        </span>
                    </label>
                    {form.errors.accept_terms ? (
                        <p className="text-sm text-destructive">
                            {form.errors.accept_terms}
                        </p>
                    ) : null}
                    {form.errors.token ? (
                        <p className="text-sm text-destructive">{form.errors.token}</p>
                    ) : null}
                    {form.errors.microchip ? (
                        <p className="text-sm text-destructive">
                            {form.errors.microchip}
                        </p>
                    ) : null}
                    {form.errors.paciente ? (
                        <p className="text-sm text-destructive">
                            {form.errors.paciente}
                        </p>
                    ) : null}
                    {form.errors.plan ? (
                        <p className="text-sm text-destructive">{form.errors.plan}</p>
                    ) : null}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={
                            form.processing ||
                            !form.data.accept_terms ||
                            !culqi_ready
                        }
                    >
                        {form.processing
                            ? 'Preparando pago…'
                            : 'Continuar al pago'}
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
}
