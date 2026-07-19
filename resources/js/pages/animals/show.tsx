import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    FileDown,
    Link2,
    MapPin,
    Pencil,
    PawPrint,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GeoCascadeValue, GeoOption } from '@/components/geo/geo-cascade-fields';
import { DeclareLostDialog } from '@/components/lost/declare-lost-dialog';
import { RecoverLostDialog } from '@/components/lost/recover-lost-dialog';
import { Button } from '@/components/ui/button';
import { formatDateTimePeru } from '@/lib/datetime-peru';
import { cn } from '@/lib/utils';
import {
    edit as animalsEdit,
    index as animalsIndex,
    show as animalsShow,
} from '@/routes/animals';

type FoundReport = {
    id: number;
    reporter_name: string;
    reporter_phone: string | null;
    reporter_email: string | null;
    message: string;
    city: string | null;
    zone: string | null;
    created_at: string | null;
};

type LostHistoryItem = {
    id: number;
    status: string;
    lost_at: string | null;
    recovered_at: string | null;
    departamento: string | null;
    provincia: string | null;
    distrito: string | null;
    last_seen_city: string | null;
    last_seen_zone: string | null;
    public_notes: string | null;
};

type LostReportSummary = {
    id: number;
    status: string;
    lost_at: string | null;
    last_seen_zone: string | null;
    last_seen_city: string | null;
    departamento?: string | null;
    provincia?: string | null;
    distrito?: string | null;
    public_notes: string | null;
    photo_url: string | null;
};

type Props = {
    animal: {
        id: number;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        color: string | null;
        birth_date: string | null;
        notes: string | null;
        photo_url: string | null;
        created_at: string | null;
        owner: {
            name: string;
            document_type: string | null;
            document_number: string;
            phone: string | null;
            email: string | null;
        };
        chip: {
            id: number;
            microchip: string;
            public_code: string;
            certificate_code: string | null;
            status: string;
            registered_at: string | null;
            implant_date: string | null;
            implant_site: string | null;
            country_code: string;
            organization: {
                id: number;
                name: string;
                ruc: string;
                city: string | null;
                contact_phone: string | null;
            } | null;
        } | null;
    };
    can_update?: boolean;
    can_declare_lost?: boolean;
    can_recover?: boolean;
    lost_report?: LostReportSummary | null;
    lost_history?: LostHistoryItem[];
    found_reports?: FoundReport[];
    public_profile_url?: string | null;
    departamentos?: GeoOption[];
    owner_geo?: GeoCascadeValue | null;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-sm text-foreground">
                {value && value !== '' ? value : '—'}
            </p>
        </div>
    );
}

function formatDateDdMmYyyy(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return value;
    return `${match[3]}-${match[2]}-${match[1]}`;
}

function formatDateTime(value: string | null | undefined): string | null {
    return formatDateTimePeru(value);
}

function locationLabel(item: {
    departamento?: string | null;
    provincia?: string | null;
    distrito?: string | null;
    last_seen_city?: string | null;
    last_seen_zone?: string | null;
}): string | null {
    const ubigeo = [item.distrito, item.provincia, item.departamento]
        .filter(Boolean)
        .join(' · ');
    if (ubigeo) return ubigeo;
    const legacy = [item.last_seen_city, item.last_seen_zone]
        .filter(Boolean)
        .join(' · ');
    return legacy || null;
}

export default function AnimalShow({
    animal,
    can_update = false,
    can_declare_lost = false,
    can_recover = false,
    lost_report = null,
    lost_history = [],
    found_reports = [],
    public_profile_url = null,
    departamentos = [],
    owner_geo = null,
}: Props) {
    const { t } = useTranslation(['animals', 'lost']);
    const [declareOpen, setDeclareOpen] = useState(false);
    const [recoverOpen, setRecoverOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const isLost = animal.chip?.status === 'lost';

    setLayoutProps({
        breadcrumbs: [
            { title: t('animals:breadcrumb'), href: animalsIndex() },
            { title: animal.name, href: animalsShow(animal.id) },
        ],
    });

    const onCopyLink = async () => {
        if (!public_profile_url) return;
        try {
            await navigator.clipboard.writeText(public_profile_url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <>
            <Head title={animal.name} />
            <div className="relative w-full flex-1 p-4 md:p-6 lg:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.045_220)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_230)_0%,_transparent_70%)]"
                />

                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="-ml-2 cursor-pointer gap-1.5 text-muted-foreground"
                    >
                        <Link href={animalsIndex()}>
                            <ArrowLeft className="size-4" />
                            {t('animals:show.back')}
                        </Link>
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                        {animal.chip?.certificate_code ? (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="cursor-pointer gap-1.5"
                            >
                                <a
                                    href={`/certificado/${animal.chip.certificate_code}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FileDown className="size-3.5" />
                                    {t('animals:show.download_certificate')}
                                </a>
                            </Button>
                        ) : null}
                        {public_profile_url ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer gap-1.5"
                                onClick={onCopyLink}
                            >
                                {copied ? (
                                    <CheckCircle2 className="size-3.5" />
                                ) : (
                                    <Link2 className="size-3.5" />
                                )}
                                {copied
                                    ? t('lost:actions.copied')
                                    : t('lost:actions.copy_link')}
                            </Button>
                        ) : null}
                        {can_declare_lost ? (
                            <Button
                                type="button"
                                size="sm"
                                className="cursor-pointer gap-1.5 bg-red-600 text-white hover:bg-red-600/90"
                                onClick={() => setDeclareOpen(true)}
                            >
                                <AlertTriangle className="size-3.5" />
                                {t('lost:actions.declare')}
                            </Button>
                        ) : null}
                        {can_recover ? (
                            <Button
                                type="button"
                                size="sm"
                                className="cursor-pointer gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90"
                                onClick={() => setRecoverOpen(true)}
                            >
                                {t('lost:actions.recover')}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {isLost ? (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-red-900 dark:text-red-100">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                        <div>
                            <p className="font-semibold">
                                {t('lost:banner.title')}
                            </p>
                            <p className="mt-0.5 text-sm opacity-90">
                                {t('lost:banner.hint')}
                            </p>
                            {lost_report ? (
                                <p className="mt-2 text-sm">
                                    {locationLabel(lost_report)}
                                    {lost_report.public_notes
                                        ? ` — ${lost_report.public_notes}`
                                        : ''}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="mb-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
                    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                        <div className="aspect-[4/5] bg-brand-sky/8">
                            {animal.photo_url ? (
                                <img
                                    src={animal.photo_url}
                                    alt={animal.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-brand-sky/40">
                                    <PawPrint className="size-14" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                                {animal.name}
                            </h1>
                            {animal.chip ? (
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                                        isLost
                                            ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                            : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
                                    )}
                                >
                                    {isLost
                                        ? t('lost:status.lost')
                                        : animal.chip.status}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-base text-muted-foreground">
                            {[animal.species, animal.breed]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    {t('animals:show.section_animal')}
                                </h2>
                                {can_update ? (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="cursor-pointer gap-1.5 bg-brand-sky text-white hover:bg-brand-sky/90"
                                    >
                                        <Link href={animalsEdit(animal.id)}>
                                            <Pencil className="size-3.5" />
                                            {t('animals:show.edit_data')}
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label={t('animals:fields.name')}
                                    value={animal.name}
                                />
                                <Field
                                    label={t('animals:fields.species')}
                                    value={animal.species}
                                />
                                <Field
                                    label={t('animals:fields.breed')}
                                    value={animal.breed}
                                />
                                <Field
                                    label={t('animals:fields.sex')}
                                    value={
                                        animal.sex === 'male'
                                            ? t('animals:sex.male')
                                            : animal.sex === 'female'
                                              ? t('animals:sex.female')
                                              : animal.sex
                                    }
                                />
                                <Field
                                    label={t('animals:fields.color')}
                                    value={animal.color}
                                />
                                <Field
                                    label={t('animals:fields.birth_date')}
                                    value={formatDateDdMmYyyy(animal.birth_date)}
                                />
                            </div>
                            {animal.notes ? (
                                <div className="mt-4">
                                    <Field
                                        label={t('animals:fields.notes')}
                                        value={animal.notes}
                                    />
                                </div>
                            ) : null}
                        </section>

                        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-6">
                            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                {t('animals:show.section_chip')}
                            </h2>
                            {animal.chip ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label={t('animals:fields.microchip')}
                                        value={animal.chip.microchip}
                                    />
                                    <Field
                                        label={t('animals:fields.public_code')}
                                        value={animal.chip.public_code}
                                    />
                                    <Field
                                        label={t('animals:fields.certificate')}
                                        value={animal.chip.certificate_code}
                                    />
                                    <Field
                                        label={t('animals:fields.implant_date')}
                                        value={animal.chip.implant_date}
                                    />
                                    <Field
                                        label={t('animals:fields.implant_site')}
                                        value={animal.chip.implant_site}
                                    />
                                    <Field
                                        label={t('animals:fields.registered_at')}
                                        value={formatDateTime(
                                            animal.chip.registered_at,
                                        )}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {t('animals:no_chip')}
                                </p>
                            )}
                        </section>
                    </div>

                    {animal.chip?.organization ? (
                        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-6">
                            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                {t('animals:show.section_clinic')}
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Field
                                    label={t('animals:fields.clinic')}
                                    value={animal.chip.organization.name}
                                />
                                <Field
                                    label={t('animals:fields.ruc')}
                                    value={animal.chip.organization.ruc}
                                />
                                <Field
                                    label={t('animals:fields.city')}
                                    value={animal.chip.organization.city}
                                />
                                <Field
                                    label={t('animals:fields.clinic_phone')}
                                    value={
                                        animal.chip.organization.contact_phone
                                    }
                                />
                            </div>
                        </section>
                    ) : null}

                    {lost_history.length > 0 ? (
                        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-6">
                            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                {t('lost:history.title')}
                            </h2>
                            <ol className="relative space-y-4 border-l border-border/70 pl-5">
                                {lost_history.map((item) => {
                                    const place = locationLabel(item);
                                    const isOpen = item.status === 'open';

                                    return (
                                        <li key={item.id} className="relative">
                                            <span
                                                className={cn(
                                                    'absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ring-4 ring-background',
                                                    isOpen
                                                        ? 'bg-red-500'
                                                        : 'bg-emerald-500',
                                                )}
                                            />
                                            <div className="rounded-2xl border border-border/50 bg-muted/15 px-4 py-3">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {t(
                                                                'lost:history.lost',
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                                            {formatDateTime(
                                                                item.lost_at,
                                                            ) ?? '—'}
                                                        </p>
                                                    </div>
                                                    {isOpen ? (
                                                        <span className="rounded-full bg-red-500/12 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                                                            {t(
                                                                'lost:history.open',
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {item.recovered_at ? (
                                                    <div className="mt-3 border-t border-border/40 pt-3">
                                                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                                                            {t(
                                                                'lost:history.recovered',
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                                            {formatDateTime(
                                                                item.recovered_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {place ? (
                                                    <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                                                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                                        <span>
                                                            <span className="font-medium text-foreground/80">
                                                                {t(
                                                                    'lost:history.location',
                                                                )}
                                                                :
                                                            </span>{' '}
                                                            {place}
                                                        </span>
                                                    </p>
                                                ) : null}

                                                {item.public_notes ? (
                                                    <p className="mt-2 text-sm text-foreground/90">
                                                        {item.public_notes}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    ) : null}

                    {isLost || found_reports.length > 0 ? (
                        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm md:p-6">
                            <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                {t('lost:found_inbox.title')}
                            </h2>
                            {found_reports.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('lost:found_inbox.empty')}
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {found_reports.map((report) => (
                                        <li
                                            key={report.id}
                                            className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <p className="font-medium">
                                                    {t('lost:found_inbox.from', {
                                                        name: report.reporter_name,
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(
                                                        report.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            <p className="mt-2 text-sm whitespace-pre-wrap">
                                                {report.message}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {t('lost:found_inbox.contact')}:{' '}
                                                {[
                                                    report.reporter_phone,
                                                    report.reporter_email,
                                                    report.city,
                                                    report.zone,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ) : null}
                </div>
            </div>

            <DeclareLostDialog
                open={declareOpen}
                onOpenChange={setDeclareOpen}
                animalId={animal.id}
                departamentos={departamentos}
                initialGeo={owner_geo}
            />
            <RecoverLostDialog
                open={recoverOpen}
                onOpenChange={setRecoverOpen}
                animalId={animal.id}
                animalName={animal.name}
            />
        </>
    );
}
