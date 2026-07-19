import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, PawPrint } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { found as reportFound, show as petShow } from '@/routes/public/pet';
import { home } from '@/routes';

type Props = {
    pet: {
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        color: string | null;
        photo_url: string | null;
        status: string;
        public_code: string;
        city: string | null;
        clinic_name: string | null;
        is_lost: boolean;
        lost: {
            lost_at: string | null;
            last_seen_zone: string | null;
            last_seen_city: string | null;
            public_notes: string | null;
            photo_url: string | null;
        } | null;
    };
};

export default function PublicPetProfile({ pet }: Props) {
    const { t } = useTranslation(['lost', 'animals']);
    const flash = usePage().props.flash as { success?: string } | undefined;
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (pet.is_lost && window.location.hash === '#hallazgo') {
            setShowForm(true);
        }
    }, [pet.is_lost]);

    const { data, setData, post, processing, errors, reset } = useForm({
        reporter_name: '',
        reporter_phone: '',
        reporter_email: '',
        message: '',
        city: pet.lost?.last_seen_city ?? pet.city ?? '',
        zone: pet.lost?.last_seen_zone ?? '',
    });

    const photo = pet.lost?.photo_url || pet.photo_url;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(reportFound(pet.public_code).url, {
            preserveScroll: true,
            onSuccess: () => {
                reset('reporter_name', 'reporter_phone', 'reporter_email', 'message');
                setShowForm(false);
            },
        });
    };

    return (
        <>
            <Head title={`${pet.name} · AlmaPet`} />
            <div className="min-h-screen bg-[#F7F9FB] text-foreground dark:bg-[#0a0a0a]">
                <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:px-6">
                    <a
                        href={home().url}
                        className="font-heading text-lg font-semibold tracking-tight text-brand-sky"
                    >
                        AlmaPet ID
                    </a>
                    <LanguageSwitcher compact />
                </header>

                <main className="mx-auto w-full max-w-3xl px-4 pb-16 md:px-6">
                    {flash?.success ? (
                        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                            {flash.success}
                        </div>
                    ) : null}

                    {pet.is_lost ? (
                        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-800 dark:text-red-200">
                            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                            <div>
                                <p className="font-semibold uppercase tracking-wide">
                                    {t('lost:public.lost_alert')}
                                </p>
                                {pet.lost?.last_seen_city ||
                                pet.lost?.last_seen_zone ? (
                                    <p className="mt-1 text-sm opacity-90">
                                        {[
                                            pet.lost.last_seen_city,
                                            pet.lost.last_seen_zone,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <p className="mb-4 text-sm text-muted-foreground">
                            {t('lost:public.not_lost')}
                        </p>
                    )}

                    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                        <div className="aspect-[16/10] bg-brand-sky/8">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt={pet.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-brand-sky/40">
                                    <PawPrint className="size-16" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 p-5 md:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                                    {pet.name}
                                </h1>
                                <span
                                    className={
                                        pet.is_lost
                                            ? 'rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300'
                                            : 'rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'
                                    }
                                >
                                    {pet.is_lost
                                        ? t('lost:status.lost')
                                        : t('lost:status.active')}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {[pet.species, pet.breed, pet.color]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {pet.clinic_name || pet.city ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('lost:public.clinic')}:{' '}
                                    {[pet.clinic_name, pet.city]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            ) : null}
                            {pet.lost?.public_notes ? (
                                <p className="rounded-2xl bg-muted/50 px-3 py-2 text-sm">
                                    {pet.lost.public_notes}
                                </p>
                            ) : null}

                            {pet.is_lost ? (
                                <div id="hallazgo" className="scroll-mt-24 pt-2">
                                    {!showForm ? (
                                        <Button
                                            type="button"
                                            className="h-11 w-full cursor-pointer bg-red-600 text-white hover:bg-red-600/90 sm:w-auto"
                                            onClick={() => setShowForm(true)}
                                        >
                                            {t('lost:public.found_cta')}
                                        </Button>
                                    ) : (
                                        <form
                                            onSubmit={submit}
                                            className="mt-2 grid gap-3 rounded-2xl border border-border/60 p-4"
                                        >
                                            <div>
                                                <h2 className="font-medium">
                                                    {t('lost:public.found_title')}
                                                </h2>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {t('lost:public.found_hint')}
                                                </p>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="reporter_name">
                                                    {t('lost:public.reporter_name')}
                                                </Label>
                                                <Input
                                                    id="reporter_name"
                                                    value={data.reporter_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'reporter_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {errors.reporter_name ? (
                                                    <p className="text-xs text-destructive">
                                                        {errors.reporter_name}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="reporter_phone">
                                                        {t(
                                                            'lost:public.reporter_phone',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="reporter_phone"
                                                        value={
                                                            data.reporter_phone
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'reporter_phone',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    {errors.reporter_phone ? (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors.reporter_phone
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="reporter_email">
                                                        {t(
                                                            'lost:public.reporter_email',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="reporter_email"
                                                        type="email"
                                                        value={
                                                            data.reporter_email
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'reporter_email',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="city">
                                                        {t('lost:public.city')}
                                                    </Label>
                                                    <Input
                                                        id="city"
                                                        value={data.city}
                                                        onChange={(e) =>
                                                            setData(
                                                                'city',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="zone">
                                                        {t('lost:public.zone')}
                                                    </Label>
                                                    <Input
                                                        id="zone"
                                                        value={data.zone}
                                                        onChange={(e) =>
                                                            setData(
                                                                'zone',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="message">
                                                    {t('lost:public.message')}
                                                </Label>
                                                <Textarea
                                                    id="message"
                                                    value={data.message}
                                                    onChange={(e) =>
                                                        setData(
                                                            'message',
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={4}
                                                    required
                                                />
                                                {errors.message ? (
                                                    <p className="text-xs text-destructive">
                                                        {errors.message}
                                                    </p>
                                                ) : null}
                                            </div>
                                            {errors.status ? (
                                                <p className="text-sm text-destructive">
                                                    {errors.status}
                                                </p>
                                            ) : null}
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="cursor-pointer bg-red-600 text-white hover:bg-red-600/90"
                                                >
                                                    {t(
                                                        'lost:public.submit_found',
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        setShowForm(false)
                                                    }
                                                >
                                                    {t('lost:declare.cancel')}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        {petShow(pet.public_code).url}
                    </p>
                </main>
            </div>
        </>
    );
}
