import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';

type Props = {
    reason: 'missing' | 'expired';
    error_detail?: string | null;
};

export default function HandoffInvalid({ reason, error_detail }: Props) {
    return (
        <PublicLayout title="Enlace no válido">
            <Head title="Enlace no válido" />
            <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                    Enlace no válido
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {reason === 'missing'
                        ? 'Falta el token de handoff. Vuelve a VetSaaS e inicia el registro otra vez.'
                        : 'Este enlace expiró o ya fue usado. Desde la ficha del paciente en VetSaaS puedes generar uno nuevo.'}
                </p>
                {error_detail ? (
                    <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-left font-mono text-xs text-destructive">
                        {error_detail}
                    </p>
                ) : null}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button asChild variant="outline">
                        <Link href="/buscar">Buscar microchip</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/">Ir al inicio</Link>
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
