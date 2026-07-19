import { Head, setLayoutProps, usePage } from '@inertiajs/react';
import {
    Filter,
    Lock,
    Plus,
    ScreenShare,
    ShieldCheck,
    Trash2,
    Users as UsersIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/can';
import {
    BulkAction,
    BulkActionBar,
    DataPagination,
    DataTable,
    DataToolbar,
    EmptyState,
    FilterChips,
    PageHeader,
    StatBadge,
} from '@/components/data-page';
import type { DataTableColumn, FilterChip } from '@/components/data-page';
import { Button } from '@/components/ui/button';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { usePermission } from '@/hooks/use-permission';
import { useRowSelection } from '@/hooks/use-row-selection';
import { Roles } from '@/lib/roles';
import users from '@/routes/platform/users';
import type { Auth, Paginated } from '@/types';
import { UserBulkDeleteDialog } from './components/user-bulk-delete-dialog';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserFormModal } from './components/user-form-modal';
import { UserRowActions } from './components/user-row-actions';
import type {
    PlatformUser,
    UserFilters,
    UserRoleOption,
    UserStats,
} from './types';

type UsersIndexProps = {
    users: Paginated<PlatformUser>;
    filters: UserFilters;
    stats: UserStats;
    roles_catalog: readonly UserRoleOption[];
    auth_user_id?: number | null;
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; user: PlatformUser }
    | { type: 'delete'; user: PlatformUser }
    | { type: 'bulk-delete' };

const DEFAULT_PER_PAGE = 10;

export default function Index({
    users: paginated,
    filters,
    stats,
    roles_catalog,
    auth_user_id = null,
}: UsersIndexProps) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Usuario', href: '/platform/users' },
            { title: 'Usuarios', href: '/platform/users' },
        ],
    });

    const { t } = useTranslation(['usuarios', 'common']);
    const { can } = usePermission();
    const canCreate = can('users.create');
    const canUpdate = can('users.update');
    const canDelete = can('users.delete');
    const canBulkDelete = can('users.bulk-delete');
    const showRowActions = canUpdate || canDelete;

    const page = usePage<{ auth: Auth }>();
    const currentUserId = useMemo(() => {
        if (typeof auth_user_id === 'number') return auth_user_id;
        const id = page.props.auth.user?.id;
        return typeof id === 'number' ? id : null;
    }, [auth_user_id, page.props.auth.user?.id]);

    const {
        search,
        setSearch,
        isLoading,
        sort,
        setSort,
        setPerPage,
        applyFilter,
    } = useDataTablePage<{ rol: string | null }>({
        routeUrl: users.index().url,
        initialFilters: filters,
        only: ['users', 'filters', 'stats'],
        errorMessage: t('toast.load_error'),
        storageKey: 'almapetid.users.prefs',
        defaults: {
            per_page: DEFAULT_PER_PAGE,
            sort: null,
            direction: null,
        },
    });

    const rolOptions: readonly FilterChip<string>[] = useMemo(
        () => [
            { value: 'todos', label: t('usuarios:filters.all_roles') },
            ...roles_catalog.map((role) => ({
                value: role.name,
                label: role.name,
            })),
        ],
        [roles_catalog, t],
    );

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });
    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (user: PlatformUser) => setModal({ type: 'edit', user }),
        [],
    );
    const openDelete = useCallback(
        (user: PlatformUser) => setModal({ type: 'delete', user }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<PlatformUser, number>({
        rows: paginated.data,
        rowKey: (user) => user.id,
    });

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.search) count += 1;
        if (filters.sort) count += 1;
        if (filters.rol) count += 1;
        if (filters.per_page !== DEFAULT_PER_PAGE) count += 1;
        return count;
    }, [filters.search, filters.sort, filters.rol, filters.per_page]);

    const columns = useMemo<DataTableColumn<PlatformUser>[]>(() => {
        const base: DataTableColumn<PlatformUser>[] = [
            {
                key: 'name',
                header: t('usuarios:columns.user'),
                sortable: true,
                cell: (user) => {
                    const isSelf = currentUserId === user.id;
                    const isAdmin = user.roles.some(
                        (r) => r.name === Roles.PLATFORM_ADMIN,
                    );
                    return (
                        <div className="flex items-center gap-2">
                            <span
                                className={
                                    isAdmin
                                        ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-sky/12 text-brand-sky'
                                }
                            >
                                {isAdmin ? (
                                    <Lock className="size-3.5" strokeWidth={2.5} />
                                ) : (
                                    <UsersIcon
                                        className="size-3.5"
                                        strokeWidth={2.5}
                                    />
                                )}
                            </span>
                            <div className="flex min-w-0 flex-col leading-tight">
                                <span className="truncate text-sm font-medium text-foreground">
                                    {user.name} {user.lastname}
                                    {isSelf && (
                                        <span className="ml-1.5 rounded-md bg-brand-sky/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-sky">
                                            {t('usuarios:row.current_user_badge')}
                                        </span>
                                    )}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'document',
                header: t('usuarios:columns.document'),
                cell: (user) =>
                    user.document_number ? (
                        <span className="font-mono text-xs text-muted-foreground">
                            {user.document_type
                                ? `${user.document_type.toUpperCase()} · `
                                : ''}
                            {user.document_number}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">
                            {t('usuarios:row.no_document')}
                        </span>
                    ),
            },
            {
                key: 'phone',
                header: t('usuarios:columns.phone'),
                cell: (user) =>
                    user.phone ? (
                        <span className="font-mono text-xs text-foreground">
                            {user.phone}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">
                            {t('usuarios:row.no_phone')}
                        </span>
                    ),
            },
            {
                key: 'role',
                header: t('usuarios:columns.role'),
                cell: (user) => {
                    const role = user.roles[0];
                    if (!role) {
                        return (
                            <span className="text-xs text-muted-foreground italic">
                                {t('usuarios:row.no_role')}
                            </span>
                        );
                    }
                    const isAdmin = role.name === Roles.PLATFORM_ADMIN;
                    return (
                        <StatBadge
                            label={role.name}
                            value=""
                            variant={isAdmin ? 'warning' : 'info'}
                        />
                    );
                },
            },
            {
                key: 'created_at',
                header: t('usuarios:columns.created_at'),
                sortable: true,
                cell: (user) => (
                    <span className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                ),
            },
        ];

        if (showRowActions) {
            base.push({
                key: 'acciones',
                header: (
                    <span className="md:sr-only">
                        {t('usuarios:columns.acciones')}
                    </span>
                ),
                align: 'right',
                cell: (user) => (
                    <div className="flex justify-end">
                        <UserRowActions
                            user={user}
                            currentUserId={currentUserId}
                            onEdit={openEdit}
                            onDelete={openDelete}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                        />
                    </div>
                ),
                className: 'w-12',
            });
        }

        return base;
    }, [
        t,
        showRowActions,
        canUpdate,
        canDelete,
        currentUserId,
        openEdit,
        openDelete,
    ]);

    return (
        <>
            <Head title={t('usuarios:title')} />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('usuarios:title')}
                    description={t('usuarios:description')}
                    stats={[
                        {
                            label: t('usuarios:stats.total'),
                            value: stats.total,
                            variant: 'info',
                            icon: UsersIcon,
                        },
                        {
                            label: t('usuarios:stats.platform_admins'),
                            value: stats.platform_admins,
                            variant: 'warning',
                            icon: ShieldCheck,
                        },
                        {
                            label: t('usuarios:stats.filters'),
                            value: activeFiltersCount,
                            variant: 'warning',
                            icon: Filter,
                        },
                        {
                            label: t('usuarios:stats.matches'),
                            value: stats.coincidencias,
                            variant: 'primary',
                            icon: ScreenShare,
                        },
                    ]}
                    action={
                        <Can permission="users.create">
                            <Button
                                type="button"
                                onClick={openCreate}
                                className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Plus className="size-4" strokeWidth={2.5} />
                                <span className="hidden sm:inline">
                                    {t('usuarios:actions.new')}
                                </span>
                                <span className="sm:hidden">
                                    {t('usuarios:actions.new_short')}
                                </span>
                            </Button>
                        </Can>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(user) => user.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={canBulkDelete ? (selection as never) : undefined}
                    ariaLiveMessage={t('usuarios:aria.results_count_other', {
                        count: stats.coincidencias,
                    })}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder={t('usuarios:search_placeholder')}
                        >
                            <FilterChips
                                ariaLabel={t('usuarios:filter_role_label')}
                                value={filters.rol ?? 'todos'}
                                onChange={(rol) =>
                                    applyFilter({ rol: rol === 'todos' ? null : rol })
                                }
                                options={rolOptions}
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
                                rol: filters.rol ?? undefined,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={UsersIcon}
                            title={
                                activeFiltersCount > 0
                                    ? t('usuarios:empty.no_results_title')
                                    : t('usuarios:empty.no_records_title')
                            }
                            description={
                                activeFiltersCount > 0
                                    ? t('usuarios:empty.no_results_description')
                                    : t('usuarios:empty.no_records_description')
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
                                        {t('usuarios:actions.create_first')}
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <UserFormModal
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                user={modal.type === 'edit' ? modal.user : null}
                rolesCatalog={roles_catalog}
            />

            <UserDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                user={modal.type === 'delete' ? modal.user : null}
                currentUserId={currentUserId}
            />

            <UserBulkDeleteDialog
                open={modal.type === 'bulk-delete'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                ids={Array.from(selection.selectedIds)}
                onCompleted={() => selection.clear()}
            />

            {canBulkDelete && (
                <BulkActionBar
                    count={selection.count}
                    labels={{
                        singular: t('usuarios:bulk.selected_singular'),
                        plural: t('usuarios:bulk.selected_plural'),
                    }}
                    onClear={selection.clear}
                >
                    <BulkAction
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={openBulkDelete}
                        className="cursor-pointer gap-1.5"
                    >
                        <Trash2 className="size-4" strokeWidth={2.5} />
                        <span className="hidden sm:inline">
                            {t('usuarios:actions.delete_selected')}
                        </span>
                    </BulkAction>
                </BulkActionBar>
            )}
        </>
    );
}
