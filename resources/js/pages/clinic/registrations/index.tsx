import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Loader2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    GeoCascadeFields,
    type GeoCascadeValue,
    type GeoOption,
} from '@/components/geo/geo-cascade-fields';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    datetimeLocalPeruToIso,
    nowDatetimeLocalPeru,
} from '@/lib/datetime-peru';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import {
    create as createRegistration,
    index as registrationsIndex,
    lost as clinicLost,
    recover as clinicRecover,
} from '@/routes/clinic/registrations';

type Row = {
    id: number;
    microchip: string;
    public_code: string;
    certificate_code: string | null;
    status: string;
    registered_at: string | null;
    animal: {
        id: number | null;
        name: string | null;
        species: string | null;
        breed: string | null;
    };
    owner: {
        name: string | null;
        document_number: string | null;
        phone: string | null;
    };
};

type Props = {
    organization: { id: number; name: string };
    registrations: Paginated<Row>;
    filters: { search: string };
    can_declare_lost?: boolean;
    can_recover?: boolean;
    departamentos?: GeoOption[];
};

function toLocalDatetimeValue(): string {
    return nowDatetimeLocalPeru();
}

export default function ClinicRegistrationsIndex({
    organization,
    registrations,
    filters,
    can_declare_lost = false,
    can_recover = false,
    departamentos = [],
}: Props) {
    const { t } = useTranslation('lost');
    const [search, setSearch] = useState(filters.search ?? '');
    const [declareRow, setDeclareRow] = useState<Row | null>(null);
    const [geo, setGeo] = useState<GeoCascadeValue>({
        departamento_id: null,
        provincia_id: null,
        distrito_id: null,
    });

    const form = useForm({
        lost_at: toLocalDatetimeValue(),
        departamento_id: null as number | null,
        provincia_id: null as number | null,
        distrito_id: null as number | null,
        public_notes: '',
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Panel clínica', href: clinicDashboard() },
            { title: 'Registros', href: registrationsIndex() },
        ],
    });

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            registrationsIndex().url,
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const onGeoChange = (next: GeoCascadeValue) => {
        setGeo(next);
        form.setData('departamento_id', next.departamento_id);
        form.setData('provincia_id', next.provincia_id);
        form.setData('distrito_id', next.distrito_id);
    };

    const closeDeclare = () => {
        setDeclareRow(null);
        setGeo({
            departamento_id: null,
            provincia_id: null,
            distrito_id: null,
        });
        form.reset();
        form.clearErrors();
    };

    const submitDeclare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!declareRow || geo.distrito_id === null) return;
        form.transform((data) => ({
            ...data,
            lost_at: datetimeLocalPeruToIso(data.lost_at),
        }));
        form.post(clinicLost(declareRow.id).url, {
            preserveScroll: true,
            onSuccess: () => closeDeclare(),
        });
    };

    const onRecover = (row: Row) => {
        if (
            !window.confirm(
                t('actions.recover_confirm', {
                    name: row.animal.name ?? row.microchip,
                }),
            )
        ) {
            return;
        }
        router.post(clinicRecover(row.id).url, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Registros de mascotas" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Registros
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Mascotas y chips inscritos por {organization.name}
                        </p>
                    </div>
                    <Button
                        asChild
                        className="cursor-pointer gap-2 rounded-2xl bg-brand-sky text-white hover:bg-brand-sky/90"
                    >
                        <Link href={createRegistration()}>
                            <Plus className="size-4" />
                            Registrar chip
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submitSearch} className="flex gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por mascota, dueño, chip…"
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="outline" className="cursor-pointer">
                        Buscar
                    </Button>
                </form>

                {registrations.data.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
                        No hay registros{filters.search ? ' con ese filtro' : ''}.
                    </p>
                ) : (
                    <div className="overflow-x-auto overflow-hidden rounded-2xl border border-border/70">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border/60 bg-muted/30 text-[11px] tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Mascota</th>
                                    <th className="px-4 py-3 font-medium">Dueño</th>
                                    <th className="px-4 py-3 font-medium">Chip</th>
                                    <th className="px-4 py-3 font-medium">Estado</th>
                                    <th className="px-4 py-3 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-border/40 last:border-0"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {row.animal.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.animal.species}
                                                {row.animal.breed
                                                    ? ` · ${row.animal.breed}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p>{row.owner.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Doc. {row.owner.document_number}
                                                {row.owner.phone
                                                    ? ` · ${row.owner.phone}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                            <p>{row.microchip}</p>
                                            <p className="text-muted-foreground">
                                                {row.public_code}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
                                                    row.status === 'lost'
                                                        ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                                        : 'bg-brand-sky/10 text-brand-sky',
                                                )}
                                            >
                                                {row.status === 'lost'
                                                    ? t('status.lost')
                                                    : row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {can_declare_lost &&
                                                row.status === 'active' ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 cursor-pointer border-red-500/40 text-red-700 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            form.setData(
                                                                'lost_at',
                                                                toLocalDatetimeValue(),
                                                            );
                                                            setGeo({
                                                                departamento_id:
                                                                    null,
                                                                provincia_id:
                                                                    null,
                                                                distrito_id:
                                                                    null,
                                                            });
                                                            form.clearErrors();
                                                            setDeclareRow(row);
                                                        }}
                                                    >
                                                        Perdido
                                                    </Button>
                                                ) : null}
                                                {can_recover &&
                                                row.status === 'lost' ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 cursor-pointer border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                                                        onClick={() =>
                                                            onRecover(row)
                                                        }
                                                    >
                                                        Recuperada
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {registrations.last_page > 1 ? (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Página {registrations.current_page} de{' '}
                            {registrations.last_page}
                        </span>
                        <div className="flex gap-2">
                            {registrations.prev_page_url ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <Link href={registrations.prev_page_url}>
                                        Anterior
                                    </Link>
                                </Button>
                            ) : null}
                            {registrations.next_page_url ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <Link href={registrations.next_page_url}>
                                        Siguiente
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>

            <Dialog
                open={declareRow !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeclare();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t('declare.title')}</DialogTitle>
                        <DialogDescription>
                            {declareRow?.animal.name
                                ? `${declareRow.animal.name} · ${declareRow.microchip}`
                                : t('declare.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDeclare} className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="clinic_lost_at">
                                {t('declare.lost_at')}
                            </Label>
                            <Input
                                id="clinic_lost_at"
                                type="datetime-local"
                                value={form.data.lost_at}
                                onChange={(e) =>
                                    form.setData('lost_at', e.target.value)
                                }
                                required
                            />
                            {form.errors.lost_at ? (
                                <p className="text-sm text-destructive">
                                    {form.errors.lost_at}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-1.5">
                            <Label>
                                {t('declare.location', 'Última ubicación')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'declare.location_hint',
                                    'Selecciona departamento, provincia y distrito donde se perdió.',
                                )}
                            </p>
                            <GeoCascadeFields
                                departamentos={departamentos}
                                value={geo}
                                onChange={onGeoChange}
                                errors={{
                                    departamento_id:
                                        form.errors.departamento_id,
                                    provincia_id: form.errors.provincia_id,
                                    distrito_id: form.errors.distrito_id,
                                }}
                                disabled={form.processing}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="clinic_notes">
                                {t('declare.public_notes')}
                            </Label>
                            <Textarea
                                id="clinic_notes"
                                value={form.data.public_notes}
                                onChange={(e) =>
                                    form.setData('public_notes', e.target.value)
                                }
                                rows={3}
                            />
                        </div>
                        {form.errors.status ? (
                            <p className="text-sm text-destructive">
                                {form.errors.status}
                            </p>
                        ) : null}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={closeDeclare}
                            >
                                {t('declare.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing || geo.distrito_id === null
                                }
                                className="cursor-pointer bg-red-600 text-white hover:bg-red-600/90"
                            >
                                {form.processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                {t('declare.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
