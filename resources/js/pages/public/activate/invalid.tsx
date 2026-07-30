import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    reason: 'not_found' | 'unavailable' | 'not_owner';
    hint?: string | null;
};

const COPY: Record<Props['reason'], { title: string; body: string }> = {
    not_found: {
        title: 'Registro no encontrado',
        body: 'El enlace de activación no es válido o el código no existe.',
    },
    unavailable: {
        title: 'No se puede activar',
        body: 'Este registro no está pendiente de pago.',
    },
    not_owner: {
        title: 'Cuenta no coincide',
        body: 'Debes iniciar sesión con el mismo documento (DNI) que registró la clínica.',
    },
};

export default function ActivateInvalid({ reason, hint }: Props) {
    const copy = COPY[reason] ?? COPY.not_found;

    return (
        <PublicLayout title={copy.title}>
            <Head title={copy.title} />
            <div className="mx-auto max-w-lg px-4 py-16 text-center">
                <h1 className="font-display text-2xl font-semibold">{copy.title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
                {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
                <div className="mt-8 flex justify-center gap-3">
                    <Button asChild variant="outline">
                        <Link href="/login">Iniciar sesión</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Crear cuenta</Link>
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
