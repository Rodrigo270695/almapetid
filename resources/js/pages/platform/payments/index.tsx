import { Head, setLayoutProps } from '@inertiajs/react';
import {
    Banknote,
    Filter,
    PawPrint,
    Plus,
    ScreenShare,
    Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/can';
import {
    DataPagination,
    DataTable,
    DataToolbar,
    EmptyState,
    FilterChips,
    PageHeader,
} from '@/components/data-page';
import type { DataTableColumn, FilterChip } from '@/components/data-page';
import { DateRangeFilter } from '@/components/date-range-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { usePermission } from '@/hooks/use-permission';
import payments from '@/routes/platform/payments';
import type { Paginated } from '@/types';
import { PaymentFormModal } from './components/payment-form-modal';
import { PaymentRowActions } from './components/payment-row-actions';
import type {
    PaymentChannel,
    PaymentChipRef,
    PaymentFilters,
    PaymentStats,
    PlanCatalogItem,
    RegistrationPayment,
    UserCatalogItem,
} from './types';

type PaymentsIndexProps = {
    payments: Paginated<RegistrationPayment>;
    filters: PaymentFilters;
    stats: PaymentStats;
    date_defaults: { desde: string; hasta: string };
    plans_catalog: readonly PlanCatalogItem[];
    users_catalog: readonly UserCatalogItem[];
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; payment: RegistrationPayment };

const DEFAULT_PER_PAGE = 10;
const DEFAULT_STATUS = 'todos';
const DEFAULT_PROVIDER = 'todos';
const DEFAULT_CHANNEL = 'todos';

function formatMoney(amount: string | number, currency: string): string {
    const n = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(n)) return `${currency} ${amount}`;
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function statusVariant(
    status: RegistrationPayment['status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'paid':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'failed':
            return 'destructive';
        default:
            return 'outline';
    }
}

function channelVariant(
    channel: string | null | undefined,
): 'default' | 'secondary' | 'outline' {
    switch (channel) {
        case 'vetsaas':
            return 'default';
        case 'partner':
            return 'secondary';
        default:
            return 'outline';
    }
}

function paymentChip(p: RegistrationPayment): PaymentChipRef | null {
    return p.chip_registration ?? p.chipRegistration ?? null;
}

function clientLabel(p: RegistrationPayment): {
    title: string;
    subtitle: string | null;
} {
    const owner = paymentChip(p)?.animal?.owner;
    if (owner) {
        const name = `${owner.name} ${owner.lastname}`.trim();
        const parts = [
            owner.document_number ? `DNI ${owner.document_number}` : null,
            owner.email,
        ].filter(Boolean);
        return {
            title: name || '—',
            subtitle: parts.length ? parts.join(' · ') : null,
        };
    }

    if (p.user) {
        return {
            title: `${p.user.name} ${p.user.lastname}`.trim(),
            subtitle: p.user.email,
        };
    }

    return { title: '—', subtitle: null };
}

export default function Index({
    payments: paginated,
    filters,
    stats,
    date_defaults,
    plans_catalog,
    users_catalog,
}: PaymentsIndexProps) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Facturación', href: '/platform/plans' },
            { title: 'Pagos', href: '/platform/payments' },
        ],
    });

    const { t } = useTranslation(['payments', 'common']);
    const { can } = usePermission();
    const canCreate = can('payments.create');
    const canUpdate = can('payments.update');

    const {
        search,
        setSearch,
        isLoading,
        sort,
        setSort,
        setPerPage,
        applyFilter,
    } = useDataTablePage<{
        status: string | null;
        provider: string | null;
        channel: string | null;
        desde: string | null;
        hasta: string | null;
    }>({
        routeUrl: payments.index().url,
        initialFilters: filters,
        only: ['payments', 'filters', 'stats', 'date_defaults'],
        errorMessage: t('payments:toast.load_error'),
        storageKey: 'almapetid.payments.prefs',
        defaults: {
            per_page: DEFAULT_PER_PAGE,
            sort: 'paid_at',
            direction: 'desc',
        },
    });

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });
    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (payment: RegistrationPayment) => setModal({ type: 'edit', payment }),
        [],
    );

    const statusOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('payments:filters.all_status') },
            { value: 'pending', label: t('payments:status.pending') },
            { value: 'paid', label: t('payments:status.paid') },
            { value: 'failed', label: t('payments:status.failed') },
            { value: 'refunded', label: t('payments:status.refunded') },
        ],
        [t],
    );

    const providerOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('payments:filters.all_providers') },
            { value: 'manual', label: t('payments:providers.manual') },
            { value: 'culqi', label: t('payments:providers.culqi') },
            { value: 'niubiz', label: t('payments:providers.niubiz') },
            { value: 'stripe', label: t('payments:providers.stripe') },
        ],
        [t],
    );

    const channelOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('payments:filters.all_channels') },
            { value: 'direct', label: t('payments:channels.direct') },
            { value: 'vetsaas', label: t('payments:channels.vetsaas') },
            { value: 'partner', label: t('payments:channels.partner') },
        ],
        [t],
    );

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.search) count += 1;
        if (filters.status !== DEFAULT_STATUS) count += 1;
        if (filters.provider !== DEFAULT_PROVIDER) count += 1;
        if ((filters.channel ?? DEFAULT_CHANNEL) !== DEFAULT_CHANNEL) count += 1;
        if (
            filters.desde !== date_defaults.desde ||
            filters.hasta !== date_defaults.hasta
        ) {
            count += 1;
        }
        if (filters.per_page !== DEFAULT_PER_PAGE) count += 1;
        return count;
    }, [filters, date_defaults]);

    const columns: DataTableColumn<RegistrationPayment>[] = useMemo(() => {
        const base: DataTableColumn<RegistrationPayment>[] = [
            {
                key: 'paid_at',
                header: t('payments:columns.paid_at'),
                sortable: true,
                cell: (p) => (
                    <div className="min-w-[9.5rem]">
                        <p className="text-sm tabular-nums text-foreground">
                            {formatDateTime(p.paid_at ?? p.created_at)}
                        </p>
                        {!p.paid_at ? (
                            <p className="text-[11px] text-muted-foreground">
                                {t('payments:columns.created_hint')}
                            </p>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'user',
                header: t('payments:columns.client'),
                cell: (p) => {
                    const client = clientLabel(p);
                    const pet = paymentChip(p)?.animal?.name;
                    return (
                        <div className="min-w-0 max-w-[14rem]">
                            <p className="truncate font-medium">{client.title}</p>
                            {client.subtitle ? (
                                <p className="truncate text-xs text-muted-foreground">
                                    {client.subtitle}
                                </p>
                            ) : null}
                            {pet ? (
                                <p className="truncate text-xs text-muted-foreground">
                                    {t('payments:columns.pet')}: {pet}
                                </p>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                key: 'organization',
                header: t('payments:columns.clinic'),
                cell: (p) =>
                    p.organization ? (
                        <div className="min-w-0 max-w-[11rem]">
                            <p className="truncate text-sm font-medium">
                                {p.organization.name}
                            </p>
                            {p.organization.ruc ? (
                                <p className="truncate text-xs text-muted-foreground">
                                    RUC {p.organization.ruc}
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'chip',
                header: t('payments:columns.chip'),
                cell: (p) => {
                    const chip = paymentChip(p);
                    return chip ? (
                        <div className="min-w-0">
                            <p className="font-mono text-xs tracking-wide">
                                {chip.microchip}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {chip.public_code}
                            </p>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    );
                },
            },
            {
                key: 'channel',
                header: t('payments:columns.channel'),
                sortable: true,
                cell: (p) => {
                    const ch = (p.channel || 'direct') as PaymentChannel;
                    return (
                        <Badge variant={channelVariant(ch)}>
                            {t(`payments:channels.${ch}`, {
                                defaultValue: ch,
                            })}
                        </Badge>
                    );
                },
            },
            {
                key: 'amount',
                header: t('payments:columns.amount'),
                sortable: true,
                cell: (p) => {
                    const clinic = Number(p.clinic_commission ?? 0);
                    return (
                        <div>
                            <p className="font-medium tabular-nums">
                                {formatMoney(p.amount, p.currency)}
                            </p>
                            {clinic > 0 ? (
                                <p className="text-[11px] text-muted-foreground">
                                    AlmaPet{' '}
                                    {formatMoney(
                                        p.platform_amount ?? p.amount,
                                        p.currency,
                                    )}
                                </p>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                key: 'status',
                header: t('payments:columns.status'),
                sortable: true,
                cell: (p) => (
                    <Badge variant={statusVariant(p.status)}>
                        {t(`payments:status.${p.status}`)}
                    </Badge>
                ),
            },
            {
                key: 'provider',
                header: t('payments:columns.provider'),
                sortable: true,
                cell: (p) => (
                    <span className="text-sm">
                        {t(`payments:providers.${p.provider}`)}
                    </span>
                ),
            },
            {
                key: 'plan',
                header: t('payments:columns.plan'),
                cell: (p) =>
                    p.plan ? (
                        <span className="text-sm">{p.plan.name}</span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
        ];

        if (canUpdate) {
            base.push({
                key: 'acciones',
                header: (
                    <span className="md:sr-only">
                        {t('payments:columns.acciones')}
                    </span>
                ),
                align: 'right',
                className: 'w-12',
                cell: (p) => (
                    <div className="flex justify-end">
                        <PaymentRowActions
                            payment={p}
                            canUpdate={canUpdate}
                            onEdit={openEdit}
                        />
                    </div>
                ),
            });
        }

        return base;
    }, [t, canUpdate, openEdit]);

    return (
        <>
            <Head title={t('payments:title')} />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('payments:title')}
                    description={t('payments:description')}
                    stats={[
                        {
                            label: t('payments:stats.earned_platform'),
                            value: formatMoney(
                                stats.earned_platform,
                                stats.currency || 'PEN',
                            ),
                            variant: 'primary',
                            icon: Wallet,
                        },
                        {
                            label: t('payments:stats.earned_total'),
                            value: formatMoney(
                                stats.earned_total,
                                stats.currency || 'PEN',
                            ),
                            variant: 'info',
                            icon: Banknote,
                        },
                        {
                            label: t('payments:stats.registrations_active'),
                            value: stats.registrations_active,
                            variant: 'primary',
                            icon: PawPrint,
                        },
                        {
                            label: t('payments:stats.registrations'),
                            value: stats.registrations,
                            variant: 'info',
                        },
                        {
                            label: t('payments:stats.paid'),
                            value: stats.paid,
                            variant: 'primary',
                        },
                        {
                            label: t('payments:stats.pending'),
                            value: stats.pending,
                            variant: 'warning',
                        },
                        {
                            label: t('payments:stats.matches'),
                            value: stats.coincidencias,
                            variant: 'muted',
                            icon: ScreenShare,
                        },
                        {
                            label: t('common:actions.filter'),
                            value: activeFiltersCount,
                            variant: 'warning',
                            icon: Filter,
                        },
                    ]}
                    action={
                        <Can permission="payments.create">
                            <Button
                                type="button"
                                onClick={openCreate}
                                className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Plus className="size-4" strokeWidth={2.5} />
                                <span className="hidden sm:inline">
                                    {t('payments:actions.new')}
                                </span>
                                <span className="sm:hidden">
                                    {t('payments:actions.new_short')}
                                </span>
                            </Button>
                        </Can>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(p) => p.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    ariaLiveMessage={t('common:feedback.no_results')}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder={t('payments:search_placeholder')}
                        >
                            <DateRangeFilter
                                desde={filters.desde}
                                hasta={filters.hasta}
                                defaultDesde={date_defaults.desde}
                                defaultHasta={date_defaults.hasta}
                                disabled={isLoading}
                                onApply={(desde, hasta) =>
                                    applyFilter({ desde, hasta })
                                }
                            />
                            <FilterChips
                                ariaLabel={t('payments:filter_status_label')}
                                value={filters.status}
                                onChange={(status) =>
                                    applyFilter({
                                        status:
                                            status === DEFAULT_STATUS
                                                ? null
                                                : status,
                                    })
                                }
                                options={statusOptions}
                            />
                            <FilterChips
                                ariaLabel={t('payments:filter_channel_label')}
                                value={filters.channel ?? DEFAULT_CHANNEL}
                                onChange={(channel) =>
                                    applyFilter({
                                        channel:
                                            channel === DEFAULT_CHANNEL
                                                ? null
                                                : channel,
                                    })
                                }
                                options={channelOptions}
                            />
                            <FilterChips
                                ariaLabel={t('payments:filter_provider_label')}
                                value={filters.provider}
                                onChange={(provider) =>
                                    applyFilter({
                                        provider:
                                            provider === DEFAULT_PROVIDER
                                                ? null
                                                : provider,
                                    })
                                }
                                options={providerOptions}
                            />
                        </DataToolbar>
                    }
                    footer={
                        <DataPagination
                            meta={paginated}
                            onPerPageChange={setPerPage}
                            preservedQuery={{
                                search: filters.search || undefined,
                                per_page: filters.per_page,
                                sort: filters.sort ?? undefined,
                                direction: filters.direction ?? undefined,
                                status:
                                    filters.status !== DEFAULT_STATUS
                                        ? filters.status
                                        : undefined,
                                provider:
                                    filters.provider !== DEFAULT_PROVIDER
                                        ? filters.provider
                                        : undefined,
                                channel:
                                    (filters.channel ?? DEFAULT_CHANNEL) !==
                                    DEFAULT_CHANNEL
                                        ? filters.channel
                                        : undefined,
                                desde: filters.desde,
                                hasta: filters.hasta,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={Banknote}
                            title={
                                activeFiltersCount > 0
                                    ? t('payments:empty.no_results_title')
                                    : t('payments:empty.no_records_title')
                            }
                            description={
                                activeFiltersCount > 0
                                    ? t('payments:empty.no_results_description')
                                    : t('payments:empty.no_records_description')
                            }
                            action={
                                activeFiltersCount === 0 && canCreate ? (
                                    <Button
                                        type="button"
                                        onClick={openCreate}
                                        className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                                    >
                                        <Plus
                                            className="size-4"
                                            strokeWidth={2.5}
                                        />
                                        {t('payments:actions.create_first')}
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <PaymentFormModal
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                payment={modal.type === 'edit' ? modal.payment : null}
                plansCatalog={plans_catalog}
                usersCatalog={users_catalog}
            />
        </>
    );
}
