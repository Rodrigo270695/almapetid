import { Head, setLayoutProps } from '@inertiajs/react';
import { ChevronDown, Filter, PawPrint, ScreenShare, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DataPagination,
    DataToolbar,
    EmptyState,
    PageHeader,
} from '@/components/data-page';
import { DateRangeFilter } from '@/components/date-range-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type PetChip = {
    id: number;
    microchip: string;
    public_code: string;
    status: string;
    certificate_code: string | null;
    registered_at: string | null;
    created_at: string | null;
    clinic: { id: number; name: string; ruc: string } | null;
};

type PetRow = {
    id: number;
    name: string;
    species: string | null;
    breed: string | null;
    sex: string | null;
    chip: PetChip | null;
};

type ClientRow = {
    id: number;
    name: string;
    lastname: string;
    full_name: string;
    document_type: string;
    document_number: string;
    email: string | null;
    phone: string | null;
    pets_count: number;
    pets: PetRow[];
    last_registration_at: string | null;
};

type ClientFilters = {
    search: string;
    per_page: number;
    desde: string;
    hasta: string;
};

type Props = {
    clients: Paginated<ClientRow>;
    filters: ClientFilters;
    date_defaults: { desde: string; hasta: string };
    stats: {
        clients: number;
        pets: number;
        active: number;
        coincidencias: number;
    };
};

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
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'active':
            return 'default';
        case 'pending_payment':
            return 'secondary';
        case 'lost':
            return 'destructive';
        default:
            return 'outline';
    }
}

export default function ClientsIndex({
    clients: paginated,
    filters,
    date_defaults,
    stats,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Facturación', href: '/platform/payments' },
            { title: 'Clientes', href: '/platform/clients' },
        ],
    });

    const { t } = useTranslation(['clients', 'common']);

    const {
        search,
        setSearch,
        isLoading,
        setPerPage,
        applyFilter,
    } = useDataTablePage<{ desde: string | null; hasta: string | null }>({
        routeUrl: '/platform/clients',
        initialFilters: filters,
        only: ['clients', 'filters', 'stats', 'date_defaults'],
        errorMessage: t('clients:toast.load_error'),
        storageKey: 'almapetid.clients.prefs',
        defaults: {
            per_page: 10,
            sort: null,
            direction: null,
        },
    });

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.search) count += 1;
        if (
            filters.desde !== date_defaults.desde ||
            filters.hasta !== date_defaults.hasta
        ) {
            count += 1;
        }
        if (filters.per_page !== 10) count += 1;
        return count;
    }, [filters, date_defaults]);

    const [expandedIds, setExpandedIds] = useState<Set<number>>(
        () => new Set(),
    );

    const toggleExpanded = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <>
            <Head title={t('clients:title')} />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('clients:title')}
                    description={t('clients:description')}
                    stats={[
                        {
                            label: t('clients:stats.clients'),
                            value: stats.clients,
                            variant: 'primary',
                            icon: Users,
                        },
                        {
                            label: t('clients:stats.pets'),
                            value: stats.pets,
                            variant: 'info',
                            icon: PawPrint,
                        },
                        {
                            label: t('clients:stats.active'),
                            value: stats.active,
                            variant: 'primary',
                        },
                        {
                            label: t('clients:stats.matches'),
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
                />

                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    <div className="border-b border-border/50 p-3 sm:p-4">
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder={t('clients:search_placeholder')}
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
                        </DataToolbar>
                    </div>

                    {paginated.data.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={
                                activeFiltersCount > 0
                                    ? t('clients:empty.no_results_title')
                                    : t('clients:empty.no_records_title')
                            }
                            description={
                                activeFiltersCount > 0
                                    ? t('clients:empty.no_results_description')
                                    : t('clients:empty.no_records_description')
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-border/60">
                            {paginated.data.map((client) => {
                                const expanded = expandedIds.has(client.id);

                                return (
                                    <li
                                        key={client.id}
                                        className="px-4 py-4 sm:px-5 sm:py-5"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-semibold text-foreground">
                                                    {client.full_name}
                                                </p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {[
                                                        client.document_number
                                                            ? `${client.document_type || 'Doc'} ${client.document_number}`
                                                            : null,
                                                        client.email,
                                                        client.phone,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline">
                                                        {client.pets_count === 1
                                                            ? t(
                                                                  'clients:pets_count',
                                                                  { count: 1 },
                                                              )
                                                            : t(
                                                                  'clients:pets_count_plural',
                                                                  {
                                                                      count: client.pets_count,
                                                                  },
                                                              )}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            client.last_registration_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-full shrink-0 gap-1.5 sm:w-auto"
                                                aria-expanded={expanded}
                                                onClick={() =>
                                                    toggleExpanded(client.id)
                                                }
                                            >
                                                <ChevronDown
                                                    className={cn(
                                                        'size-4 transition-transform',
                                                        expanded && 'rotate-180',
                                                    )}
                                                    aria-hidden
                                                />
                                                {expanded
                                                    ? t('clients:collapse_pets')
                                                    : t('clients:expand_pets')}
                                            </Button>
                                        </div>

                                        {expanded ? (
                                            <div className="mt-3 space-y-2">
                                                {client.pets.map((pet) => (
                                                    <div
                                                        key={pet.id}
                                                        className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 sm:px-4"
                                                    >
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-foreground">
                                                                    {pet.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {[
                                                                        pet.species,
                                                                        pet.breed,
                                                                    ]
                                                                        .filter(
                                                                            Boolean,
                                                                        )
                                                                        .join(
                                                                            ' · ',
                                                                        ) ||
                                                                        '—'}
                                                                </p>
                                                            </div>
                                                            {pet.chip ? (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge
                                                                        variant={statusVariant(
                                                                            pet
                                                                                .chip
                                                                                .status,
                                                                        )}
                                                                    >
                                                                        {t(
                                                                            `clients:chip_status.${pet.chip.status}`,
                                                                            {
                                                                                defaultValue:
                                                                                    pet
                                                                                        .chip
                                                                                        .status,
                                                                            },
                                                                        )}
                                                                    </Badge>
                                                                    <span className="font-mono text-xs tracking-wide">
                                                                        {
                                                                            pet
                                                                                .chip
                                                                                .microchip
                                                                        }
                                                                    </span>
                                                                    <span className="text-[11px] text-muted-foreground">
                                                                        {
                                                                            pet
                                                                                .chip
                                                                                .public_code
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        {pet.chip?.clinic ? (
                                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                                {
                                                                    pet.chip
                                                                        .clinic
                                                                        .name
                                                                }
                                                                {pet.chip.clinic
                                                                    .ruc
                                                                    ? ` · RUC ${pet.chip.clinic.ruc}`
                                                                    : ''}
                                                            </p>
                                                        ) : null}
                                                        {pet.chip ? (
                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                {t(
                                                                    'clients:registered_at',
                                                                )}
                                                                :{' '}
                                                                {formatDateTime(
                                                                    pet.chip
                                                                        .registered_at ??
                                                                        pet.chip
                                                                            .created_at,
                                                                )}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="border-t border-border/50 px-3 py-3 sm:px-4">
                        <DataPagination
                            meta={paginated}
                            onPerPageChange={setPerPage}
                            preservedQuery={{
                                search: filters.search || undefined,
                                per_page: filters.per_page,
                                desde: filters.desde,
                                hasta: filters.hasta,
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
