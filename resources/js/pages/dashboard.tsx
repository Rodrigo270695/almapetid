import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes';
import { show as animalsShow } from '@/routes/animals';

type AnimalRow = {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    chip: {
        microchip: string;
        public_code: string;
        status: string;
        registered_at: string | null;
        organization: { name: string; ruc: string } | null;
    } | null;
};

type Props = {
    owner: {
        name: string;
        document_number: string;
        created_by_clinic: string | null;
    } | null;
    animals: AnimalRow[];
};

export default function Dashboard({ owner, animals }: Props) {
    const { t } = useTranslation('dashboard');

    setLayoutProps({
        breadcrumbs: [
            {
                title: t('breadcrumb'),
                href: dashboard(),
            },
        ],
    });

    return (
        <>
            <Head title={t('title')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {owner
                            ? t('welcome_named', { name: owner.name })
                            : t('welcome')}
                    </p>
                </div>

                {animals.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            {t('empty')}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {t('empty_hint')}
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2">
                        {animals.map((animal) => (
                            <li key={animal.id}>
                                <Link
                                    href={animalsShow(animal.id)}
                                    className="block rounded-2xl border border-border/70 bg-card/40 p-5 transition hover:border-brand-sky/40 hover:bg-brand-sky/5"
                                >
                                <p className="text-lg font-semibold">
                                    {animal.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {animal.species}
                                    {animal.breed ? ` · ${animal.breed}` : ''}
                                </p>
                                {animal.chip ? (
                                    <div className="mt-4 space-y-1 text-sm">
                                        <p className="font-mono tabular-nums">
                                            {animal.chip.microchip}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Código {animal.chip.public_code} ·{' '}
                                            {animal.chip.status}
                                        </p>
                                        {animal.chip.organization ? (
                                            <p className="text-muted-foreground">
                                                {t('registered_by', {
                                                    clinic: animal.chip
                                                        .organization.name,
                                                })}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        {t('no_chip')}
                                    </p>
                                )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
