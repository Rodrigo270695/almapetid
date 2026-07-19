import { Head, Link, router, setLayoutProps, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    ImagePlus,
    Loader2,
    PawPrint,
    X,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    index as animalsIndex,
    show as animalsShow,
    update as animalsUpdate,
} from '@/routes/animals';
import { store as suggestCatalog } from '@/routes/catalog/suggestions';

type BreedOption = { id: number; name: string };
type SpeciesOption = {
    id: number;
    name: string;
    breeds: BreedOption[];
};

type CatalogCreatedFlash = {
    type: 'species' | 'breed';
    species_id: number | null;
    breed_id: number | null;
};

type Props = {
    animal: {
        id: number;
        name: string;
        species_id: number | null;
        breed_id: number | null;
        sex: string | null;
        color: string | null;
        birth_date: string | null;
        notes: string | null;
        photo_url: string | null;
    };
    species_catalog: SpeciesOption[];
};

function RequiredMark() {
    return <span className="ml-0.5 font-semibold text-red-500">*</span>;
}

function FieldLabel({
    htmlFor,
    children,
    required,
}: {
    htmlFor?: string;
    children: ReactNode;
    required?: boolean;
}) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
            {children}
            {required ? <RequiredMark /> : null}
        </label>
    );
}

export default function AnimalsEdit({ animal, species_catalog }: Props) {
    const { t } = useTranslation(['animals', 'common']);
    const page = usePage<{
        flash?: {
            id?: string;
            catalog_created?: CatalogCreatedFlash | null;
        } | null;
    }>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [speciesId, setSpeciesId] = useState<string | null>(
        animal.species_id ? String(animal.species_id) : null,
    );
    const [breedId, setBreedId] = useState<string | null>(
        animal.breed_id ? String(animal.breed_id) : null,
    );
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        animal.photo_url,
    );
    const [removePhoto, setRemovePhoto] = useState(false);

    const form = useForm({
        name: animal.name,
        species_id: animal.species_id ?? 0,
        breed_id: animal.breed_id,
        sex: animal.sex ?? '',
        color: animal.color ?? '',
        birth_date: animal.birth_date ?? '',
        notes: animal.notes ?? '',
        photo: null as File | null,
        remove_photo: false,
        _method: 'put',
    });

    useEffect(() => {
        const created = page.props.flash?.catalog_created;
        if (!created) return;

        if (created.species_id) {
            setSpeciesId(String(created.species_id));
            form.setData('species_id', created.species_id);
        }
        if (created.breed_id) {
            setBreedId(String(created.breed_id));
            form.setData('breed_id', created.breed_id);
        } else if (created.type === 'species') {
            setBreedId(null);
            form.setData('breed_id', null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page.props.flash?.id]);

    setLayoutProps({
        breadcrumbs: [
            { title: t('animals:breadcrumb'), href: animalsIndex() },
            { title: animal.name, href: animalsShow(animal.id) },
            {
                title: t('animals:edit.title'),
                href: `/animals/${animal.id}/edit`,
            },
        ],
    });

    const speciesOptions = useMemo<ComboboxOption[]>(
        () =>
            species_catalog.map((s) => ({
                value: String(s.id),
                label: s.name,
            })),
        [species_catalog],
    );

    const breedOptions = useMemo<ComboboxOption[]>(() => {
        const species = species_catalog.find((s) => String(s.id) === speciesId);
        return (species?.breeds ?? []).map((b) => ({
            value: String(b.id),
            label: b.name,
        }));
    }, [species_catalog, speciesId]);

    const onSpeciesChange = (value: string | null) => {
        setSpeciesId(value);
        setBreedId(null);
        form.setData('species_id', value ? Number(value) : 0);
        form.setData('breed_id', null);
    };

    const onBreedChange = (value: string | null) => {
        setBreedId(value);
        form.setData('breed_id', value ? Number(value) : null);
    };

    const suggestSpecies = (query: string) => {
        router.post(
            suggestCatalog.url(),
            { type: 'species', name: query },
            { preserveScroll: true },
        );
    };

    const suggestBreed = (query: string) => {
        if (!speciesId) return;
        router.post(
            suggestCatalog.url(),
            {
                type: 'breed',
                name: query,
                species_id: Number(speciesId),
            },
            { preserveScroll: true },
        );
    };

    const onPhotoChange = (file: File | null) => {
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
            setRemovePhoto(false);
            form.setData('photo', file);
            form.setData('remove_photo', false);
            return;
        }
        form.setData('photo', null);
    };

    const clearPhoto = () => {
        setPhotoPreview(null);
        setRemovePhoto(true);
        form.setData('photo', null);
        form.setData('remove_photo', true);
        if (fileRef.current) fileRef.current.value = '';
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            breed_id: data.breed_id || null,
            sex: data.sex || null,
            color: data.color || null,
            birth_date: data.birth_date || null,
            notes: data.notes || null,
            remove_photo: removePhoto,
            photo: data.photo ?? undefined,
        }));
        form.post(animalsUpdate(animal.id).url, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const canSubmit =
        form.data.name.trim().length >= 2 &&
        form.data.species_id > 0 &&
        !form.processing;

    return (
        <>
            <Head title={t('animals:edit.title')} />
            <div className="relative mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.045_220)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_230)_0%,_transparent_70%)]"
                />

                <div className="mb-6">
                    <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-sky text-white shadow-lg shadow-brand-sky/25">
                        <PawPrint className="size-6" />
                    </div>
                    <h1 className="font-heading text-3xl font-semibold tracking-tight">
                        {t('animals:edit.title')}
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {t('animals:edit.subtitle')}
                    </p>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-sm"
                >
                    <div className="grid lg:grid-cols-[minmax(16rem,22rem)_1fr]">
                        <aside className="border-b border-border/60 bg-brand-sky/[0.04] p-5 lg:border-r lg:border-b-0 md:p-6">
                            <FieldLabel>{t('animals:fields.photo')}</FieldLabel>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('animals:create.photo_hint')}
                            </p>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className={cn(
                                    'group relative mt-4 flex aspect-[4/5] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-background/60 transition hover:border-brand-sky/50',
                                    photoPreview && 'border-solid border-brand-sky/30',
                                )}
                            >
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                                        <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-sky/10 text-brand-sky">
                                            <ImagePlus className="size-6" />
                                        </span>
                                        <span className="text-sm font-medium text-foreground">
                                            {t('animals:create.photo_cta')}
                                        </span>
                                    </div>
                                )}
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    onPhotoChange(e.target.files?.[0] ?? null)
                                }
                            />
                            {photoPreview ? (
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 cursor-pointer gap-1.5"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        <Camera className="size-3.5" />
                                        {t('animals:create.photo_change')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 cursor-pointer text-destructive"
                                        onClick={clearPhoto}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ) : null}
                        </aside>

                        <div className="space-y-5 p-5 md:p-7">
                            <div className="grid gap-2">
                                <FieldLabel htmlFor="name" required>
                                    {t('animals:fields.name')}
                                </FieldLabel>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    className="h-11"
                                />
                                {form.errors.name ? (
                                    <p className="text-sm text-red-500">
                                        {form.errors.name}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <FieldLabel htmlFor="species" required>
                                        {t('animals:fields.species')}
                                    </FieldLabel>
                                    <Combobox
                                        id="species"
                                        options={speciesOptions}
                                        value={speciesId}
                                        onChange={onSpeciesChange}
                                        placeholder={t(
                                            'animals:create.species_placeholder',
                                        )}
                                        searchPlaceholder={t(
                                            'animals:create.species_search',
                                        )}
                                        emptyMessage={t(
                                            'animals:create.species_empty',
                                        )}
                                        creatable
                                        createOptionLabel={(q) =>
                                            t('animals:create.suggest_species', {
                                                name: q,
                                            })
                                        }
                                        onCreateOption={suggestSpecies}
                                        clearable={false}
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <FieldLabel htmlFor="breed">
                                        {t('animals:fields.breed')}
                                    </FieldLabel>
                                    <Combobox
                                        id="breed"
                                        options={breedOptions}
                                        value={breedId}
                                        onChange={onBreedChange}
                                        placeholder={
                                            speciesId
                                                ? t(
                                                      'animals:create.breed_placeholder',
                                                  )
                                                : t(
                                                      'animals:create.breed_disabled',
                                                  )
                                        }
                                        creatable={Boolean(speciesId)}
                                        createOptionLabel={(q) =>
                                            t('animals:create.suggest_breed', {
                                                name: q,
                                            })
                                        }
                                        onCreateOption={suggestBreed}
                                        disabled={!speciesId}
                                        clearable
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <FieldLabel>
                                        {t('animals:fields.sex')}
                                    </FieldLabel>
                                    <Select
                                        value={form.data.sex || '__none__'}
                                        onValueChange={(v) =>
                                            form.setData(
                                                'sex',
                                                v === '__none__' ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">
                                                —
                                            </SelectItem>
                                            <SelectItem value="male">
                                                {t('animals:sex.male')}
                                            </SelectItem>
                                            <SelectItem value="female">
                                                {t('animals:sex.female')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <FieldLabel htmlFor="color">
                                        {t('animals:fields.color')}
                                    </FieldLabel>
                                    <Input
                                        id="color"
                                        value={form.data.color}
                                        onChange={(e) =>
                                            form.setData(
                                                'color',
                                                e.target.value,
                                            )
                                        }
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <FieldLabel htmlFor="birth_date">
                                        {t('animals:fields.birth_date')}
                                    </FieldLabel>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={form.data.birth_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'birth_date',
                                                e.target.value,
                                            )
                                        }
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <FieldLabel htmlFor="notes">
                                    {t('animals:fields.notes')}
                                </FieldLabel>
                                <Textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="cursor-pointer"
                                >
                                    <Link href={animalsShow(animal.id)}>
                                        {t('common:actions.cancel')}
                                    </Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                                >
                                    {form.processing ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : null}
                                    {t('animals:edit.submit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
