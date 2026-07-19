import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { Camera, ChevronRight, PawPrint, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    index as animalsIndex,
    register as animalsRegister,
    show as animalsShow,
} from '@/routes/animals';
import { cn } from '@/lib/utils';

type AnimalRow = {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    sex: string | null;
    color: string | null;
    photo_url: string | null;
    chip: {
        microchip: string;
        public_code: string;
        status: string;
        registered_at: string | null;
        organization: { name: string; ruc: string } | null;
    } | null;
};

type Props = {
    owner: { name: string; document_number: string } | null;
    animals: AnimalRow[];
    has_unused_payment?: boolean;
    unused_payment_id?: number | null;
    culqi_enabled?: boolean;
};

function sexLabel(
    sex: string | null,
    t: (key: string) => string,
): string | null {
    if (!sex) return null;
    if (sex === 'male') return t('sex.male');
    if (sex === 'female') return t('sex.female');
    return sex;
}

export default function AnimalsIndex({
    owner,
    animals,
    has_unused_payment = false,
    unused_payment_id = null,
    culqi_enabled = false,
}: Props) {
    const { t } = useTranslation(['animals', 'lost']);

    setLayoutProps({
        breadcrumbs: [{ title: t('animals:breadcrumb'), href: animalsIndex() }],
    });

    const registerHref = has_unused_payment
        ? `/animals/create?payment_id=${unused_payment_id}`
        : animalsRegister();

    return (
        <>
            <Head title={t('index.title')} />
            <div className="relative w-full flex-1 p-4 md:p-6 lg:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.045_220)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_230)_0%,_transparent_70%)]"
                />

                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-sky text-white shadow-lg shadow-brand-sky/25">
                            <PawPrint className="size-6" />
                        </div>
                        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                            {t('index.title')}
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
                            {owner
                                ? t('index.subtitle_named', { name: owner.name })
                                : t('index.subtitle')}
                        </p>
                        {animals.length > 0 ? (
                            <p className="mt-2 text-xs font-medium text-brand-sky">
                                {animals.length === 1
                                    ? t('index.count', { count: 1 })
                                    : t('index.count_plural', {
                                          count: animals.length,
                                      })}
                            </p>
                        ) : null}
                    </div>
                    <Button
                        asChild
                        className="h-11 shrink-0 cursor-pointer gap-2 bg-brand-sky px-5 text-white shadow-md shadow-brand-sky/20 hover:bg-brand-sky/90"
                    >
                        <Link href={registerHref} prefetch>
                            <Plus className="size-4" strokeWidth={2.5} />
                            {has_unused_payment
                                ? t('index.continue_register')
                                : t('index.register_cta')}
                        </Link>
                    </Button>
                </div>

                {animals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center backdrop-blur-sm">
                        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-brand-sky/10 text-brand-sky">
                            <Camera className="size-7" />
                        </div>
                        <p className="text-base font-medium text-foreground">
                            {t('index.empty')}
                        </p>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            {t('index.empty_hint')}
                        </p>
                        {!culqi_enabled ? (
                            <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
                                {t('register.culqi_disabled')}
                            </p>
                        ) : (
                            <Button
                                asChild
                                className="mt-6 cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                <Link href={registerHref}>
                                    <Plus className="size-4" />
                                    {t('index.register_cta')}
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <ul className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {animals.map((animal) => {
                            const sex = sexLabel(animal.sex, t);
                            return (
                                <li key={animal.id}>
                                    <Link
                                        href={animalsShow(animal.id)}
                                        className="group flex h-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-brand-sky/35 hover:shadow-md"
                                    >
                                        <div className="relative w-[38%] min-w-[7.5rem] shrink-0 overflow-hidden bg-brand-sky/8">
                                            {animal.photo_url ? (
                                                <img
                                                    src={animal.photo_url}
                                                    alt={animal.name}
                                                    className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-brand-sky/50">
                                                    <PawPrint className="size-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h2 className="truncate font-heading text-lg font-semibold tracking-tight">
                                                        {animal.name}
                                                    </h2>
                                                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                                </div>
                                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                                    {[
                                                        animal.species,
                                                        animal.breed,
                                                        sex,
                                                        animal.color,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                            {animal.chip ? (
                                                <div className="space-y-1.5">
                                                    <p className="truncate font-mono text-xs tabular-nums text-foreground/80">
                                                        {animal.chip.microchip}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[0.65rem] tracking-wide text-muted-foreground">
                                                            {animal.chip.public_code}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
                                                                animal.chip
                                                                    .status ===
                                                                    'lost'
                                                                    ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                                                    : animal
                                                                            .chip
                                                                            .status ===
                                                                        'active'
                                                                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                                                                      : 'bg-muted text-muted-foreground',
                                                            )}
                                                        >
                                                            {animal.chip
                                                                .status ===
                                                            'lost' ? (
                                                                <ShieldAlert className="size-3" />
                                                            ) : (
                                                                <ShieldCheck className="size-3" />
                                                            )}
                                                            {animal.chip
                                                                .status ===
                                                            'lost'
                                                                ? t(
                                                                      'lost:status.lost',
                                                                  )
                                                                : animal.chip
                                                                      .status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    {t('no_chip')}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}
