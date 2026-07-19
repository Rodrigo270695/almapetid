import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    Check,
    Cat,
    Clock,
    Loader2,
    MoreHorizontal,
    PawPrint,
    Plus,
    Power,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/can';
import {
    DataTable,
    EmptyState,
    PageHeader,
    StatBadge,
    type DataTableColumn,
} from '@/components/data-page';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import catalog from '@/routes/platform/catalog';

type BreedRow = {
    id: number;
    name: string;
    active: boolean;
    sort_order: number;
};

type SpeciesRow = {
    id: number;
    name: string;
    slug: string;
    active: boolean;
    sort_order: number;
    breeds: BreedRow[];
};

type SuggestionRow = {
    id: number;
    type: 'species' | 'breed';
    name: string;
    species_id: number | null;
    species?: { id: number; name: string } | null;
    requested_by?: {
        id: number;
        name: string;
        lastname: string | null;
        email: string;
    } | null;
    created_at: string;
};

type Props = {
    species: SpeciesRow[];
    suggestions: SuggestionRow[];
    stats: {
        species: number;
        breeds: number;
        pending: number;
    };
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create-species' }
    | { type: 'create-breed' }
    | { type: 'delete-species'; row: SpeciesRow }
    | { type: 'delete-breed'; row: BreedRow };

export default function CatalogIndex({ species, suggestions, stats }: Props) {
    const { t } = useTranslation(['catalog', 'common']);
    const { can } = usePermission();
    const canManage = can('catalog.manage');
    const canApprove = can('catalog.approve');

    const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(
        species[0]?.id ?? null,
    );
    const [modal, setModal] = useState<ModalState>({ type: 'idle' });
    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);

    setLayoutProps({
        breadcrumbs: [
            { title: t('catalog:breadcrumb'), href: catalog.index.url() },
            { title: t('catalog:title'), href: catalog.index.url() },
        ],
    });

    const selectedSpecies = useMemo(
        () => species.find((s) => s.id === selectedSpeciesId) ?? null,
        [species, selectedSpeciesId],
    );

    const speciesForm = useForm({ name: '' });
    const breedForm = useForm({ name: '', species_id: 0 });

    const toggleSpeciesActive = useCallback((row: SpeciesRow) => {
        router.put(
            catalog.species.update.url(row.id),
            { name: row.name, active: !row.active },
            { preserveScroll: true },
        );
    }, []);

    const toggleBreedActive = useCallback((row: BreedRow) => {
        router.put(
            catalog.breeds.update.url(row.id),
            { name: row.name, active: !row.active },
            { preserveScroll: true },
        );
    }, []);

    const submitSpecies = (e: FormEvent) => {
        e.preventDefault();
        speciesForm.post(catalog.species.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                speciesForm.reset('name');
                closeModal();
            },
        });
    };

    const submitBreed = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedSpeciesId) return;
        breedForm.transform((data) => ({
            ...data,
            species_id: selectedSpeciesId,
        }));
        breedForm.post(catalog.breeds.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                breedForm.reset('name');
                breedForm.transform((d) => d);
                closeModal();
            },
        });
    };

    const confirmDeleteSpecies = () => {
        if (modal.type !== 'delete-species') return;
        const row = modal.row;
        router.delete(catalog.species.destroy.url(row.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedSpeciesId === row.id) {
                    setSelectedSpeciesId(null);
                }
                closeModal();
            },
        });
    };

    const confirmDeleteBreed = () => {
        if (modal.type !== 'delete-breed') return;
        router.delete(catalog.breeds.destroy.url(modal.row.id), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const approve = (id: number) => {
        router.post(catalog.suggestions.approve.url(id), {}, {
            preserveScroll: true,
        });
    };

    const reject = (id: number) => {
        router.post(catalog.suggestions.reject.url(id), {}, {
            preserveScroll: true,
        });
    };

    const speciesColumns = useMemo<DataTableColumn<SpeciesRow>[]>(() => {
        const cols: DataTableColumn<SpeciesRow>[] = [
            {
                key: 'name',
                header: t('catalog:columns.species'),
                cell: (row) => (
                    <button
                        type="button"
                        onClick={() => setSelectedSpeciesId(row.id)}
                        className={cn(
                            'flex w-full cursor-pointer items-center gap-2 text-left',
                            selectedSpeciesId === row.id && 'text-brand-sky',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-full',
                                selectedSpeciesId === row.id
                                    ? 'bg-brand-sky/15 text-brand-sky'
                                    : 'bg-muted/60 text-muted-foreground',
                            )}
                        >
                            <PawPrint className="size-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                                {row.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {t('catalog:row.breeds_count', {
                                    count: row.breeds.length,
                                })}
                            </span>
                        </span>
                    </button>
                ),
            },
            {
                key: 'status',
                header: t('catalog:columns.status'),
                cell: (row) => (
                    <StatBadge
                        label={
                            row.active
                                ? t('catalog:active')
                                : t('catalog:inactive')
                        }
                        value=""
                        variant={row.active ? 'success' : 'muted'}
                    />
                ),
            },
        ];

        if (canManage) {
            cols.push({
                key: 'acciones',
                header: (
                    <span className="md:sr-only">
                        {t('catalog:columns.acciones')}
                    </span>
                ),
                align: 'right',
                className: 'w-12',
                cell: (row) => (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('catalog:row.actions_for', {
                                        name: row.name,
                                    })}
                                    className="size-8 cursor-pointer"
                                >
                                    <MoreHorizontal
                                        className="size-4"
                                        strokeWidth={2.5}
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onSelect={() => toggleSpeciesActive(row)}
                                >
                                    <Power
                                        className="size-4"
                                        strokeWidth={2.25}
                                    />
                                    {row.active
                                        ? t('catalog:deactivate')
                                        : t('catalog:activate')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                    onSelect={() =>
                                        setModal({
                                            type: 'delete-species',
                                            row,
                                        })
                                    }
                                >
                                    <Trash2
                                        className="size-4"
                                        strokeWidth={2.25}
                                    />
                                    {t('common:actions.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            });
        }

        return cols;
    }, [t, canManage, selectedSpeciesId, toggleSpeciesActive]);

    const breedColumns = useMemo<DataTableColumn<BreedRow>[]>(() => {
        const cols: DataTableColumn<BreedRow>[] = [
            {
                key: 'name',
                header: t('catalog:columns.breed'),
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-sky/12 text-brand-sky">
                            <Cat className="size-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                            {row.name}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: t('catalog:columns.status'),
                cell: (row) => (
                    <StatBadge
                        label={
                            row.active
                                ? t('catalog:active')
                                : t('catalog:inactive')
                        }
                        value=""
                        variant={row.active ? 'success' : 'muted'}
                    />
                ),
            },
        ];

        if (canManage) {
            cols.push({
                key: 'acciones',
                header: (
                    <span className="md:sr-only">
                        {t('catalog:columns.acciones')}
                    </span>
                ),
                align: 'right',
                className: 'w-12',
                cell: (row) => (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('catalog:row.actions_for', {
                                        name: row.name,
                                    })}
                                    className="size-8 cursor-pointer"
                                >
                                    <MoreHorizontal
                                        className="size-4"
                                        strokeWidth={2.5}
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onSelect={() => toggleBreedActive(row)}
                                >
                                    <Power
                                        className="size-4"
                                        strokeWidth={2.25}
                                    />
                                    {row.active
                                        ? t('catalog:deactivate')
                                        : t('catalog:activate')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                    onSelect={() =>
                                        setModal({
                                            type: 'delete-breed',
                                            row,
                                        })
                                    }
                                >
                                    <Trash2
                                        className="size-4"
                                        strokeWidth={2.25}
                                    />
                                    {t('common:actions.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            });
        }

        return cols;
    }, [t, canManage, toggleBreedActive]);

    return (
        <>
            <Head title={t('catalog:title')} />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={t('catalog:title')}
                    description={t('catalog:subtitle')}
                    stats={[
                        {
                            label: t('catalog:stats.species'),
                            value: stats.species,
                            variant: 'info',
                            icon: PawPrint,
                        },
                        {
                            label: t('catalog:stats.breeds'),
                            value: stats.breeds,
                            variant: 'primary',
                            icon: Cat,
                        },
                        {
                            label: t('catalog:stats.pending'),
                            value: stats.pending,
                            variant: stats.pending > 0 ? 'warning' : 'muted',
                            icon: Clock,
                        },
                    ]}
                />

                {suggestions.length > 0 ? (
                    <section className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {t('catalog:suggestions.title')}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {t('catalog:suggestions.hint')}
                            </p>
                        </div>
                        <ul className="space-y-2">
                            {suggestions.map((s) => {
                                const requester = s.requested_by
                                    ? `${s.requested_by.name}${s.requested_by.lastname ? ` ${s.requested_by.lastname}` : ''}`
                                    : '—';
                                return (
                                    <li
                                        key={s.id}
                                        className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatBadge
                                                    label={
                                                        s.type === 'species'
                                                            ? t(
                                                                  'catalog:type.species',
                                                              )
                                                            : t(
                                                                  'catalog:type.breed',
                                                              )
                                                    }
                                                    value=""
                                                    variant="warning"
                                                />
                                                <span className="font-medium text-foreground">
                                                    {s.name}
                                                </span>
                                                {s.type === 'breed' &&
                                                s.species ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        · {s.species.name}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                                {t(
                                                    'catalog:suggestions.requested_by',
                                                    { name: requester },
                                                )}
                                            </p>
                                        </div>
                                        {canApprove ? (
                                            <div className="flex shrink-0 gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="cursor-pointer gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
                                                    onClick={() =>
                                                        approve(s.id)
                                                    }
                                                >
                                                    <Check className="size-3.5" />
                                                    {t(
                                                        'catalog:suggestions.approve',
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="cursor-pointer gap-1"
                                                    onClick={() =>
                                                        reject(s.id)
                                                    }
                                                >
                                                    <X className="size-3.5" />
                                                    {t(
                                                        'catalog:suggestions.reject',
                                                    )}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    {t('catalog:species_panel.title')}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {t('catalog:species_panel.hint')}
                                </p>
                            </div>
                            <Can permission="catalog.manage">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                        setModal({ type: 'create-species' })
                                    }
                                    className="cursor-pointer gap-1.5 bg-brand-sky text-white hover:bg-brand-sky/90"
                                >
                                    <Plus
                                        className="size-3.5"
                                        strokeWidth={2.5}
                                    />
                                    {t('catalog:actions.new_species')}
                                </Button>
                            </Can>
                        </div>

                        <DataTable
                            columns={speciesColumns}
                            data={species}
                            rowKey={(row) => row.id}
                            getRowClassName={(row) =>
                                selectedSpeciesId === row.id
                                    ? 'bg-brand-sky/8'
                                    : undefined
                            }
                            ariaLiveMessage={t('catalog:aria.species_count', {
                                count: species.length,
                            })}
                            emptyState={
                                <EmptyState
                                    icon={PawPrint}
                                    title={t('catalog:species_panel.empty')}
                                    description={t(
                                        'catalog:species_panel.empty_hint',
                                    )}
                                    action={
                                        canManage ? (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setModal({
                                                        type: 'create-species',
                                                    })
                                                }
                                                className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                                            >
                                                <Plus
                                                    className="size-4"
                                                    strokeWidth={2.5}
                                                />
                                                {t(
                                                    'catalog:actions.new_species',
                                                )}
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    {t('catalog:breeds_panel.title')}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {selectedSpecies
                                        ? t('catalog:breeds_panel.for_species', {
                                              name: selectedSpecies.name,
                                          })
                                        : t(
                                              'catalog:breeds_panel.select_species',
                                          )}
                                </p>
                            </div>
                            <Can permission="catalog.manage">
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!selectedSpecies}
                                    onClick={() =>
                                        setModal({ type: 'create-breed' })
                                    }
                                    className="cursor-pointer gap-1.5 bg-brand-sky text-white hover:bg-brand-sky/90 disabled:opacity-50"
                                >
                                    <Plus
                                        className="size-3.5"
                                        strokeWidth={2.5}
                                    />
                                    {t('catalog:actions.new_breed')}
                                </Button>
                            </Can>
                        </div>

                        <DataTable
                            columns={breedColumns}
                            data={selectedSpecies?.breeds ?? []}
                            rowKey={(row) => row.id}
                            ariaLiveMessage={t('catalog:aria.breeds_count', {
                                count: selectedSpecies?.breeds.length ?? 0,
                            })}
                            emptyState={
                                <EmptyState
                                    icon={Cat}
                                    title={
                                        selectedSpecies
                                            ? t('catalog:breeds_panel.empty')
                                            : t(
                                                  'catalog:breeds_panel.select_species',
                                              )
                                    }
                                    description={
                                        selectedSpecies
                                            ? t(
                                                  'catalog:breeds_panel.empty_hint',
                                              )
                                            : t(
                                                  'catalog:breeds_panel.select_species_hint',
                                              )
                                    }
                                    action={
                                        canManage && selectedSpecies ? (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setModal({
                                                        type: 'create-breed',
                                                    })
                                                }
                                                className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                                            >
                                                <Plus
                                                    className="size-4"
                                                    strokeWidth={2.5}
                                                />
                                                {t(
                                                    'catalog:actions.new_breed',
                                                )}
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            }
                        />
                    </div>
                </div>
            </div>

            <FormModal
                open={modal.type === 'create-species'}
                onOpenChange={(open) => {
                    if (!open) {
                        speciesForm.reset();
                        speciesForm.clearErrors();
                        closeModal();
                    }
                }}
                title={t('catalog:form.species_title')}
                description={t('catalog:form.species_description')}
                size="sm"
                onSubmit={submitSpecies}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={closeModal}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                speciesForm.processing ||
                                speciesForm.data.name.trim().length < 2
                            }
                            className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            {speciesForm.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t('common:actions.create')}
                        </Button>
                    </>
                }
            >
                <FormSection
                    title={t('catalog:form.section_basic')}
                    description={t('catalog:form.species_hint')}
                >
                    <FormField
                        label={t('catalog:columns.species')}
                        htmlFor="species_name"
                        required
                        error={speciesForm.errors.name}
                    >
                        <Input
                            id="species_name"
                            value={speciesForm.data.name}
                            onChange={(e) =>
                                speciesForm.setData('name', e.target.value)
                            }
                            placeholder={t(
                                'catalog:species_panel.placeholder',
                            )}
                            autoFocus
                        />
                    </FormField>
                </FormSection>
            </FormModal>

            <FormModal
                open={modal.type === 'create-breed'}
                onOpenChange={(open) => {
                    if (!open) {
                        breedForm.reset();
                        breedForm.clearErrors();
                        closeModal();
                    }
                }}
                title={t('catalog:form.breed_title')}
                description={
                    selectedSpecies
                        ? t('catalog:form.breed_description', {
                              species: selectedSpecies.name,
                          })
                        : undefined
                }
                size="sm"
                onSubmit={submitBreed}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={closeModal}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                breedForm.processing ||
                                !selectedSpeciesId ||
                                breedForm.data.name.trim().length < 2
                            }
                            className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            {breedForm.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t('common:actions.create')}
                        </Button>
                    </>
                }
            >
                <FormSection
                    title={t('catalog:form.section_basic')}
                    description={t('catalog:form.breed_hint')}
                >
                    <FormField
                        label={t('catalog:columns.breed')}
                        htmlFor="breed_name"
                        required
                        error={breedForm.errors.name}
                    >
                        <Input
                            id="breed_name"
                            value={breedForm.data.name}
                            onChange={(e) =>
                                breedForm.setData('name', e.target.value)
                            }
                            placeholder={t('catalog:breeds_panel.placeholder')}
                            autoFocus
                        />
                    </FormField>
                </FormSection>
            </FormModal>

            <FormModal
                open={modal.type === 'delete-species'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                title={t('catalog:delete.species_title')}
                description={
                    modal.type === 'delete-species'
                        ? t('catalog:confirm_delete_species', {
                              name: modal.row.name,
                          })
                        : undefined
                }
                size="sm"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={closeModal}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={confirmDeleteSpecies}
                        >
                            {t('common:actions.delete')}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    {t('catalog:delete.species_hint')}
                </p>
            </FormModal>

            <FormModal
                open={modal.type === 'delete-breed'}
                onOpenChange={(open) => {
                    if (!open) closeModal();
                }}
                title={t('catalog:delete.breed_title')}
                description={
                    modal.type === 'delete-breed'
                        ? t('catalog:confirm_delete_breed', {
                              name: modal.row.name,
                          })
                        : undefined
                }
                size="sm"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={closeModal}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={confirmDeleteBreed}
                        >
                            {t('common:actions.delete')}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    {t('catalog:delete.breed_hint')}
                </p>
            </FormModal>
        </>
    );
}
