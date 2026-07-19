import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import {
    create as createRegistration,
    index as registrationsIndex,
} from '@/routes/clinic/registrations';

type Props = {
    organization: {
        id: number;
        name: string;
        ruc: string;
        address: string | null;
    };
    stats: {
        registrations: number;
        active: number;
    };
    recent: Array<{
        id: number;
        microchip: string;
        public_code: string;
        certificate_code: string | null;
        status: string;
        registered_at: string | null;
        animal: { name: string | null; species: string | null };
        owner: { name: string | null; document_number: string | null };
    }>;
};

export default function ClinicDashboard({
    organization,
    stats,
    recent,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            {
                title: 'Panel clínica',
                href: clinicDashboard(),
            },
        ],
    });

    return (
        <>
            <Head title="Panel clínica" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            {organization.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            RUC {organization.ruc}
                            {organization.address
                                ? ` · ${organization.address}`
                                : ''}
                        </p>
                    </div>
                    <Button asChild className="rounded-2xl">
                        <Link href={createRegistration()}>
                            <Plus className="size-4" />
                            Registrar chip
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/40 p-5">
                        <p className="text-sm text-muted-foreground">
                            Registros totales
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums">
                            {stats.registrations}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/40 p-5">
                        <p className="text-sm text-muted-foreground">Activos</p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums">
                            {stats.active}
                        </p>
                    </div>
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Últimos registros
                        </h2>
                        <Link
                            href={registrationsIndex()}
                            className="text-xs font-medium text-brand-sky hover:underline"
                        >
                            Ver todos
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                            Aún no hay registros. Empieza registrando un
                            propietario, mascota y microchip.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
                            {recent.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {item.animal.name}{' '}
                                            <span className="font-normal text-muted-foreground">
                                                ({item.animal.species})
                                            </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.owner.name} · Doc.{' '}
                                            {item.owner.document_number}
                                        </p>
                                    </div>
                                    <div className="text-sm sm:text-right">
                                        <p className="font-mono tabular-nums">
                                            {item.microchip}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {item.public_code} · {item.status}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
