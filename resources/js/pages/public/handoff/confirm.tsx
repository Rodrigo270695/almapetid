import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Pricing = {
    digital_amount: number;
    physical_amount: number;
    currency: string;
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
    no_charge_at_clinic?: boolean;
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
                    La clínica registra la mascota sin cobro. Luego el dueño
                    activa el carnet digital (S/25) desde su cuenta AlmaPet.
                    Carnet físico opcional (+S/30).
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
                        <p className="font-medium text-foreground">Precios para el dueño</p>
                        <p className="mt-2 text-sm">
                            Carnet digital:{' '}
                            <span className="font-semibold tabular-nums">
                                {money(pricing.digital_amount, pricing.currency)}
                            </span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Carnet físico (opcional): +
                            {money(pricing.physical_amount, pricing.currency)}
                        </p>
                    </div>
                ) : null}

                <form
                    className="mt-8 space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/handoff');
                    }}
                >
                    <label className="flex items-start gap-3 text-sm">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={form.data.accept_terms}
                            onChange={(e) =>
                                form.setData('accept_terms', e.target.checked)
                            }
                        />
                        <span>
                            Confirmo que los datos son correctos y acepto los
                            términos de AlmaPet ID.
                        </span>
                    </label>
                    {form.errors.accept_terms ? (
                        <p className="text-sm text-destructive">{form.errors.accept_terms}</p>
                    ) : null}
                    {form.errors.token ? (
                        <p className="text-sm text-destructive">{form.errors.token}</p>
                    ) : null}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.processing || !form.data.accept_terms}
                    >
                        {form.processing ? 'Registrando…' : 'Registrar sin cobro'}
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
}
