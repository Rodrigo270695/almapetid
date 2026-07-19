import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, MapPin, PawPrint, Search } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { PageHero } from '@/components/public/page-hero';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PublicLayout from '@/layouts/public-layout';
import { choose } from '@/routes/auth';
import { cn } from '@/lib/utils';

const ALL = '__all__';

type LostPetCard = {
    id: number;
    name: string | null;
    species: string | null;
    breed: string | null;
    color: string | null;
    photo_url: string | null;
    public_code: string | null;
    profile_url: string | null;
    lost_at: string | null;
    place: string[];
    public_notes: string | null;
    clinic_city: string | null;
};

type PaginatedPets = {
    data: LostPetCard[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    pets: PaginatedPets;
    filters: {
        city: string | null;
        species: string | null;
    };
    cities: string[];
    speciesOptions: string[];
    totalOpen: number;
};

function formatLostDate(iso: string | null, locale: string): string {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeZone: 'America/Lima',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export default function PublicLostWall({
    pets,
    filters,
    cities,
    speciesOptions,
    totalOpen,
}: Props) {
    const { t, i18n } = useTranslation('welcome');
    const [city, setCity] = useState(filters.city ?? '');
    const [species, setSpecies] = useState(filters.species ?? '');

    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'es-PE';

    const applyFilters = (e?: FormEvent) => {
        e?.preventDefault();
        router.get(
            '/perdidos',
            {
                ...(city ? { city } : {}),
                ...(species ? { species } : {}),
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setCity('');
        setSpecies('');
        router.get('/perdidos', {}, { preserveState: true, replace: true });
    };

    const hasFilters = Boolean(filters.city || filters.species);

    const countLabel = useMemo(
        () =>
            t('lost_wall.count', {
                count: totalOpen,
                filtered: pets.total,
            }),
        [t, totalOpen, pets.total],
    );

    return (
        <PublicLayout flushTop title={t('lost_wall.title')}>
            <Head title={t('lost_wall.title')} />
            <PageHero
                image="/images/landing-hero.jpg"
                eyebrow={t('lost_cta.eyebrow')}
                title={t('lost_wall.title')}
                subtitle={t('lost_wall.subtitle')}
                chips={[
                    t('pages.chips.reunion'),
                    t('pages.chips.privacy'),
                    t('pages.chips.peru'),
                ]}
                ctas={[
                    {
                        label: t('lost_cta.search'),
                        href: '/buscar',
                    },
                    {
                        label: t('magnet.cta_start'),
                        href: choose(),
                        variant: 'secondary',
                    },
                ]}
            />

            <section className="border-b border-border/50 bg-background py-12 md:py-16">
                <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                    <form
                        onSubmit={applyFilters}
                        className="flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-muted/15 p-4 md:flex-row md:items-end md:p-5"
                    >
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="lost-city"
                                className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase"
                            >
                                {t('lost_wall.filters.city')}
                            </label>
                            <Select
                                value={city || ALL}
                                onValueChange={(v) =>
                                    setCity(v === ALL ? '' : v)
                                }
                            >
                                <SelectTrigger
                                    id="lost-city"
                                    className="h-11 w-full cursor-pointer rounded-xl border-border/70 bg-background shadow-none"
                                >
                                    <SelectValue
                                        placeholder={t(
                                            'lost_wall.filters.all_cities',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>
                                        {t('lost_wall.filters.all_cities')}
                                    </SelectItem>
                                    {cities.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="lost-species"
                                className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase"
                            >
                                {t('lost_wall.filters.species')}
                            </label>
                            <Select
                                value={species || ALL}
                                onValueChange={(v) =>
                                    setSpecies(v === ALL ? '' : v)
                                }
                            >
                                <SelectTrigger
                                    id="lost-species"
                                    className="h-11 w-full cursor-pointer rounded-xl border-border/70 bg-background shadow-none"
                                >
                                    <SelectValue
                                        placeholder={t(
                                            'lost_wall.filters.all_species',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>
                                        {t('lost_wall.filters.all_species')}
                                    </SelectItem>
                                    {speciesOptions.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                className="h-11 cursor-pointer rounded-xl bg-brand-sky px-5 text-white hover:bg-brand-sky/90"
                            >
                                {t('lost_wall.filters.apply')}
                            </Button>
                            {hasFilters ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="h-11 cursor-pointer rounded-xl"
                                >
                                    {t('lost_wall.filters.clear')}
                                </Button>
                            ) : null}
                        </div>
                    </form>

                    <p className="mt-6 text-sm text-muted-foreground">
                        {countLabel}
                    </p>

                    {pets.data.length === 0 ? (
                        <div className="mt-8 rounded-[1.75rem] border border-dashed border-border/80 bg-muted/10 px-6 py-14 text-center">
                            <AlertTriangle className="mx-auto size-8 text-muted-foreground/50" />
                            <p className="mt-4 font-display text-xl font-semibold tracking-tight">
                                {hasFilters
                                    ? t('lost_wall.empty_filtered_title')
                                    : t('lost_wall.empty_title')}
                            </p>
                            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                                {hasFilters
                                    ? t('lost_wall.empty_filtered_body')
                                    : t('lost_wall.empty_body')}
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Button
                                    asChild
                                    className="cursor-pointer rounded-2xl"
                                >
                                    <Link href="/buscar">
                                        <Search className="size-4" />
                                        {t('lost_cta.search')}
                                    </Link>
                                </Button>
                                {hasFilters ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="cursor-pointer rounded-2xl"
                                    >
                                        {t('lost_wall.filters.clear')}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {pets.data.map((pet) => (
                                <li key={pet.id}>
                                    <article
                                        className={cn(
                                            'flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm transition hover:border-brand-sky/40',
                                        )}
                                    >
                                        <div className="relative aspect-[16/11] bg-muted/40">
                                            {pet.photo_url ? (
                                                <img
                                                    src={pet.photo_url}
                                                    alt={pet.name ?? ''}
                                                    className="size-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-brand-sky/35">
                                                    <PawPrint className="size-12" />
                                                </div>
                                            )}
                                            <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                                                {t('lost_wall.badge')}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 flex-col px-4 py-4">
                                            <h2 className="font-display text-xl font-semibold tracking-tight">
                                                {pet.name}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {[
                                                    pet.species,
                                                    pet.breed,
                                                    pet.color,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                            {pet.place.length > 0 ? (
                                                <p className="mt-3 flex items-start gap-1.5 text-sm text-foreground/80">
                                                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                                                    <span>
                                                        {pet.place.join(' · ')}
                                                    </span>
                                                </p>
                                            ) : null}
                                            {pet.lost_at ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {t('lost_wall.lost_since', {
                                                        date: formatLostDate(
                                                            pet.lost_at,
                                                            locale,
                                                        ),
                                                    })}
                                                </p>
                                            ) : null}
                                            {pet.public_notes ? (
                                                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                                                    {pet.public_notes}
                                                </p>
                                            ) : null}
                                            <div className="mt-auto pt-4">
                                                {pet.profile_url ? (
                                                    <Button
                                                        asChild
                                                        className="w-full cursor-pointer rounded-xl"
                                                    >
                                                        <a
                                                            href={`${pet.profile_url}#hallazgo`}
                                                        >
                                                            {t(
                                                                'lost_wall.cta_help',
                                                            )}
                                                        </a>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    )}

                    {pets.last_page > 1 ? (
                        <div className="mt-10 flex items-center justify-center gap-3">
                            {pets.prev_page_url ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="cursor-pointer rounded-xl"
                                >
                                    <Link
                                        href={pets.prev_page_url}
                                        preserveState
                                    >
                                        {t('lost_wall.prev')}
                                    </Link>
                                </Button>
                            ) : null}
                            <span className="text-sm text-muted-foreground">
                                {t('lost_wall.page', {
                                    current: pets.current_page,
                                    last: pets.last_page,
                                })}
                            </span>
                            {pets.next_page_url ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="cursor-pointer rounded-xl"
                                >
                                    <Link
                                        href={pets.next_page_url}
                                        preserveState
                                    >
                                        {t('lost_wall.next')}
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </section>

            <ClientMagnet />
        </PublicLayout>
    );
}
