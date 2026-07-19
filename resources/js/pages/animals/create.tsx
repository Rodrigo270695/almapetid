import { Head, router, setLayoutProps, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    Cat,
    ImagePlus,
    Loader2,
    PawPrint,
    ShieldCheck,
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
import { index as animalsIndex, store as animalsStore } from '@/routes/animals';
import { store as suggestCatalog } from '@/routes/catalog/suggestions';
import { cn } from '@/lib/utils';

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
    payment: {
        id: number;
        amount: number;
        currency: string;
        plan_name: string | null;
        paid_at: string | null;
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

export default function AnimalsCreate({ payment, species_catalog }: Props) {
    const { t } = useTranslation(['animals', 'common']);
    const page = usePage<{
        flash?: {
            id?: string;
            catalog_created?: CatalogCreatedFlash | null;
        } | null;
    }>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [speciesId, setSpeciesId] = useState<string | null>(null);
    const [breedId, setBreedId] = useState<string | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const form = useForm({
        payment_id: payment.id,
        name: '',
        species_id: 0,
        breed_id: null as number | null,
        sex: '',
        color: '',
        birth_date: '',
        notes: '',
        photo: null as File | null,
        microchip: '',
        implant_date: '',
        implant_site: '',
    });

    useEffect(() => {
        const created = page.props.flash?.catalog_created;
        if (!created) {
            return;
        }

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

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    setLayoutProps({
        breadcrumbs: [
            { title: t('animals:breadcrumb'), href: animalsIndex() },
            { title: t('animals:create.title'), href: '/animals/create' },
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
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }
        if (!file) {
            setPhotoPreview(null);
            form.setData('photo', null);
            return;
        }
        setPhotoPreview(URL.createObjectURL(file));
        form.setData('photo', file);
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
            implant_date: data.implant_date || null,
            implant_site: data.implant_site || null,
            microchip: data.microchip.replace(/\D+/g, ''),
            photo: data.photo ?? undefined,
        }));
        form.post(animalsStore().url, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const canSubmit =
        form.data.name.trim().length >= 2 &&
        form.data.species_id > 0 &&
        form.data.microchip.replace(/\D+/g, '').length >= 9 &&
        form.data.microchip.replace(/\D+/g, '').length <= 20 &&
        !form.processing;

    return (
        <>
            <Head title={t('animals:create.title')} />
            <div className="relative mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.045_220)_0%,_transparent_68%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.3_0.045_230)_0%,_transparent_68%)]"
                />

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-sky text-white shadow-lg shadow-brand-sky/25">
                            <PawPrint className="size-6" />
                        </div>
                        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                            {t('animals:create.title')}
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-base">
                            {t('animals:create.subtitle', {
                                plan: payment.plan_name ?? 'AlmaPet',
                            })}
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:self-auto">
                        <ShieldCheck className="size-3.5" />
                        {t('animals:create.paid_badge')}
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm"
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
                                    'group relative mt-4 flex aspect-[4/5] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-background/60 transition hover:border-brand-sky/50 hover:bg-brand-sky/5',
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
                                        <span className="text-xs">
                                            JPG, PNG · máx. 5 MB
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
                                        onClick={() => {
                                            onPhotoChange(null);
                                            if (fileRef.current) {
                                                fileRef.current.value = '';
                                            }
                                        }}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ) : null}
                            {form.errors.photo ? (
                                <p className="mt-2 text-sm text-red-500">
                                    {form.errors.photo}
                                </p>
                            ) : null}
                        </aside>

                        <div className="space-y-7 p-5 md:p-7">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-sky/12 text-brand-sky">
                                        <Cat className="size-4" />
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            {t('animals:create.section_identity')}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'animals:create.section_identity_hint',
                                            )}
                                        </p>
                                    </div>
                                </div>

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
                                        placeholder={t(
                                            'animals:create.name_placeholder',
                                        )}
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
                                                t(
                                                    'animals:create.suggest_species',
                                                    { name: q },
                                                )
                                            }
                                            onCreateOption={suggestSpecies}
                                            clearable={false}
                                            className="h-11"
                                        />
                                        {form.errors.species_id ? (
                                            <p className="text-sm text-red-500">
                                                {form.errors.species_id}
                                            </p>
                                        ) : null}
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
                                            searchPlaceholder={t(
                                                'animals:create.breed_search',
                                            )}
                                            emptyMessage={t(
                                                'animals:create.breed_empty',
                                            )}
                                            creatable={Boolean(speciesId)}
                                            createOptionLabel={(q) =>
                                                t(
                                                    'animals:create.suggest_breed',
                                                    { name: q },
                                                )
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
                                                <SelectValue
                                                    placeholder={t(
                                                        'animals:fields.sex',
                                                    )}
                                                />
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
                            </section>

                            <section className="space-y-4 rounded-2xl border border-brand-sky/20 bg-brand-sky/5 p-4 md:p-5">
                                <h2 className="text-sm font-semibold text-brand-sky">
                                    {t('animals:create.section_chip')}
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <FieldLabel htmlFor="microchip" required>
                                            {t('animals:fields.microchip')}
                                        </FieldLabel>
                                        <Input
                                            id="microchip"
                                            inputMode="numeric"
                                            value={form.data.microchip}
                                            onChange={(e) =>
                                                form.setData(
                                                    'microchip',
                                                    e.target.value.replace(
                                                        /\D+/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            maxLength={20}
                                            placeholder="15 dígitos ISO"
                                            className="h-11 font-mono tracking-wide"
                                        />
                                        {form.errors.microchip ? (
                                            <p className="text-sm text-red-500">
                                                {form.errors.microchip}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'animals:create.microchip_hint',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="implant_date">
                                            {t('animals:fields.implant_date')}
                                        </FieldLabel>
                                        <Input
                                            id="implant_date"
                                            type="date"
                                            value={form.data.implant_date}
                                            onChange={(e) =>
                                                form.setData(
                                                    'implant_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="implant_site">
                                            {t('animals:fields.implant_site')}
                                        </FieldLabel>
                                        <Input
                                            id="implant_site"
                                            value={form.data.implant_site}
                                            onChange={(e) =>
                                                form.setData(
                                                    'implant_site',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </section>

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

                            <div className="flex justify-end border-t border-border/60 pt-5">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="h-11 cursor-pointer gap-2 bg-brand-sky px-6 text-white hover:bg-brand-sky/90"
                                >
                                    {form.processing ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <PawPrint className="size-4" />
                                    )}
                                    {t('animals:create.submit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
