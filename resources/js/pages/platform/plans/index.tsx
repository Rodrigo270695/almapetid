import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { CreditCard, Filter, Plus, ScreenShare } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { usePermission } from '@/hooks/use-permission';
import plans from '@/routes/platform/plans';
import type { Paginated } from '@/types';
import { PlanDeleteDialog } from './components/plan-delete-dialog';
import { PlanRowActions } from './components/plan-row-actions';
import type { Plan, PlanFilters, PlanStats } from './types';

type PlansIndexProps = {
    plans: Paginated<Plan>;
    filters: PlanFilters;
    stats: PlanStats;
};

type ModalState =
    | { type: 'idle' }
    | { type: 'delete'; plan: Plan };

const DEFAULT_PER_PAGE = 10;
const DEFAULT_STATUS = 'todos';
const DEFAULT_PERIOD = 'todos';

function formatMoney(amount: string, currency: string): string {
    const n = Number(amount);
    if (!Number.isFinite(n)) return `${currency} ${amount}`;
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

export default function Index({
    plans: paginated,
    filters,
    stats,
}: PlansIndexProps) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Facturación', href: '/platform/plans' },
            { title: 'Planes', href: '/platform/plans' },
        ],
    });

    const { t } = useTranslation(['plans', 'common']);
    const { can } = usePermission();
    const canCreate = can('plans.create');
    const canUpdate = can('plans.update');
    const canDelete = can('plans.delete');
    const showRowActions = canUpdate || canDelete;

    const {
        search,
        setSearch,
        isLoading,
        sort,
        setSort,
        setPerPage,
        applyFilter,
    } = useDataTablePage<{ status: string | null; period: string | null }>({
        routeUrl: plans.index().url,
        initialFilters: filters,
        only: ['plans', 'filters', 'stats'],
        errorMessage: t('plans:toast.load_error'),
        storageKey: 'almapetid.plans.prefs',
        defaults: {
            per_page: DEFAULT_PER_PAGE,
            sort: null,
            direction: null,
        },
    });

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });
    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openDelete = useCallback(
        (plan: Plan) => setModal({ type: 'delete', plan }),
        [],
    );

    const statusOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('plans:filters.all_status') },
            { value: 'active', label: t('plans:filters.active') },
            { value: 'inactive', label: t('plans:filters.inactive') },
        ],
        [t],
    );

    const periodOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('plans:filters.all_periods') },
            { value: 'registration', label: t('plans:periods.registration') },
            { value: 'annual', label: t('plans:periods.annual') },
        ],
        [t],
    );

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.search) count += 1;
        if (filters.sort) count += 1;
        if (filters.status !== DEFAULT_STATUS) count += 1;
        if (filters.period !== DEFAULT_PERIOD) count += 1;
        if (filters.per_page !== DEFAULT_PER_PAGE) count += 1;
        return count;
    }, [filters]);

    const columns: DataTableColumn<Plan>[] = useMemo(() => {
        const base: DataTableColumn<Plan>[] = [
            {
                key: 'name',
                header: t('plans:columns.name'),
                sortable: true,
                cell: (plan) => (
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                                {plan.name}
                            </span>
                            {plan.is_default ? (
                                <Badge variant="secondary">
                                    {t('plans:row.default_badge')}
                                </Badge>
                            ) : null}
                            {!plan.active ? (
                                <Badge variant="outline">
                                    {t('plans:row.inactive_badge')}
                                </Badge>
                            ) : null}
                        </div>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                            {plan.code}
                        </p>
                    </div>
                ),
            },
            {
                key: 'billing_period',
                header: t('plans:columns.period'),
                sortable: true,
                cell: (plan) => (
                    <span className="text-sm">
                        {t(`plans:periods.${plan.billing_period}`)}
                        {plan.duration_months
                            ? ` · ${plan.duration_months}m`
                            : ''}
                    </span>
                ),
            },
            {
                key: 'amount',
                header: t('plans:columns.amount'),
                sortable: true,
                cell: (plan) => (
                    <div className="space-y-0.5 text-sm">
                        <p className="font-medium tabular-nums">
                            {formatMoney(plan.amount, plan.currency)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                {t('plans:columns.amount_direct')}
                            </span>
                        </p>
                        <p className="tabular-nums text-muted-foreground">
                            {formatMoney(
                                plan.vetsaas_amount ?? plan.amount,
                                plan.currency,
                            )}
                            <span className="ml-1 text-xs">
                                {t('plans:columns.amount_vetsaas')}
                            </span>
                            {plan.vetsaas_clinic_commission != null &&
                            Number(plan.vetsaas_clinic_commission) > 0 ? (
                                <span className="ml-1 text-xs">
                                    (
                                    {t('plans:columns.clinic_cut', {
                                        amount: formatMoney(
                                            plan.vetsaas_clinic_commission,
                                            plan.currency,
                                        ),
                                    })}
                                    )
                                </span>
                            ) : null}
                        </p>
                    </div>
                ),
            },
            {
                key: 'payments_count',
                header: t('plans:columns.payments'),
                cell: (plan) => (
                    <span className="tabular-nums text-muted-foreground">
                        {plan.payments_count ?? 0}
                    </span>
                ),
            },
        ];

        if (showRowActions) {
            base.push({
                key: 'acciones',
                header: (
                    <span className="md:sr-only">
                        {t('plans:columns.acciones')}
                    </span>
                ),
                align: 'right',
                className: 'w-12',
                cell: (plan) => (
                    <div className="flex justify-end">
                        <PlanRowActions
                            plan={plan}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onDelete={openDelete}
                        />
                    </div>
                ),
            });
        }

        return base;
    }, [t, showRowActions, canUpdate, canDelete, openDelete]);

    return (
        <>
            <Head title={t('plans:title')} />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('plans:title')}
                    description={t('plans:description')}
                    stats={[
                        {
                            label: t('plans:stats.total'),
                            value: stats.total,
                            variant: 'info',
                            icon: CreditCard,
                        },
                        {
                            label: t('plans:stats.active'),
                            value: stats.active,
                            variant: 'primary',
                        },
                        {
                            label: t('plans:stats.annual'),
                            value: stats.annual,
                            variant: 'warning',
                        },
                        {
                            label: t('plans:stats.matches'),
                            value: stats.coincidencias,
                            variant: 'primary',
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
                        <Can permission="plans.create">
                            <Button
                                type="button"
                                asChild
                                className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link href={plans.create()} prefetch>
                                    <Plus className="size-4" strokeWidth={2.5} />
                                    <span className="hidden sm:inline">
                                        {t('plans:actions.new')}
                                    </span>
                                    <span className="sm:hidden">
                                        {t('plans:actions.new_short')}
                                    </span>
                                </Link>
                            </Button>
                        </Can>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(plan) => plan.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    ariaLiveMessage={t('common:feedback.no_results')}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder={t('plans:search_placeholder')}
                        >
                            <FilterChips
                                ariaLabel={t('plans:filter_status_label')}
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
                                ariaLabel={t('plans:filter_period_label')}
                                value={filters.period}
                                onChange={(period) =>
                                    applyFilter({
                                        period:
                                            period === DEFAULT_PERIOD
                                                ? null
                                                : period,
                                    })
                                }
                                options={periodOptions}
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
                                period:
                                    filters.period !== DEFAULT_PERIOD
                                        ? filters.period
                                        : undefined,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={CreditCard}
                            title={
                                activeFiltersCount > 0
                                    ? t('plans:empty.no_results_title')
                                    : t('plans:empty.no_records_title')
                            }
                            description={
                                activeFiltersCount > 0
                                    ? t('plans:empty.no_results_description')
                                    : t('plans:empty.no_records_description')
                            }
                            action={
                                activeFiltersCount === 0 && canCreate ? (
                                    <Button
                                        type="button"
                                        asChild
                                        className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                                    >
                                        <Link href={plans.create()} prefetch>
                                            <Plus
                                                className="size-4"
                                                strokeWidth={2.5}
                                            />
                                            {t('plans:actions.create_first')}
                                        </Link>
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <PlanDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                plan={modal.type === 'delete' ? modal.plan : null}
            />
        </>
    );
}
