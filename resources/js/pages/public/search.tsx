import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ExternalLink,
    PawPrint,
    Search,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientMagnet } from '@/components/public/client-magnet';
import { PageHero } from '@/components/public/page-hero';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { cn } from '@/lib/utils';
import { choose } from '@/routes/auth';

type SearchResult = {
    name: string | null;
    species: string | null;
    breed: string | null;
    sex: string | null;
    color: string | null;
    photo_url: string | null;
    status: string;
    public_code: string;
    microchip_masked: string;
    country_code: string | null;
    city: string | null;
    clinic_name: string | null;
    is_lost: boolean;
    profile_url: string;
    lost: {
        lost_at: string | null;
        last_seen_zone: string | null;
        last_seen_city: string | null;
        public_notes: string | null;
        photo_url: string | null;
    } | null;
};

type Props = {
    q?: string | null;
    state?: 'empty' | 'invalid' | 'found' | 'not_found';
    result?: SearchResult | null;
};

export default function PublicSearch({
    q = null,
    state = 'empty',
    result = null,
}: Props) {
    const { t } = useTranslation('welcome');
    const [query, setQuery] = useState(q ?? '');

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        const next = query.trim();
        router.get('/buscar', next ? { q: next } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const photo = result?.lost?.photo_url || result?.photo_url || null;
    const locationBits = [
        result?.lost?.last_seen_city,
        result?.lost?.last_seen_zone,
    ].filter(Boolean);

    return (
        <PublicLayout flushTop title={t('search_page.title')}>
            <Head title={t('search_page.title')} />
            <PageHero
                image="/images/landing-microchip.jpg"
                eyebrow={t('search_page.eyebrow')}
                title={t('search_page.title')}
                subtitle={t('search_page.subtitle')}
                chips={[
                    t('pages.chips.iso'),
                    t('pages.chips.privacy'),
                    t('pages.chips.peru'),
                ]}
            >
                <form
                    onSubmit={onSearch}
                    className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row"
                >
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/45" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('hero.search_placeholder')}
                            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 pr-3 pl-11 text-sm text-white placeholder:text-white/45 outline-none backdrop-blur-md focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/35"
                            autoComplete="off"
                            inputMode="text"
                            name="q"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="h-12 cursor-pointer rounded-2xl bg-brand-sky px-6 text-white hover:bg-brand-sky/90"
                    >
                        {t('hero.search_cta')}
                    </Button>
                </form>
                <p className="mt-3 max-w-md text-xs text-white/55">
                    {t('search_page.hint')}
                </p>
            </PageHero>

            {state !== 'empty' ? (
                <section className="border-b border-border/50 bg-background py-12 md:py-16">
                    <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
                        {state === 'invalid' ? (
                            <div className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/8 px-5 py-5 text-sm text-amber-950 dark:text-amber-100">
                                {t('search_page.invalid')}
                            </div>
                        ) : null}

                        {state === 'not_found' ? (
                            <div className="rounded-[1.75rem] border border-border/70 bg-muted/20 px-5 py-8 text-center">
                                <p className="font-display text-xl font-semibold tracking-tight">
                                    {t('search_page.not_found_title')}
                                </p>
                                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                                    {t('search_page.not_found_body', {
                                        q: q ?? '',
                                    })}
                                </p>
                                <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
                                    {t('search_page.not_found_edu')}
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-3">
                                    <Button
                                        asChild
                                        className="cursor-pointer rounded-2xl"
                                    >
                                        <Link href={choose()}>
                                            {t('magnet.cta_start')}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="cursor-pointer rounded-2xl"
                                    >
                                        <Link href="/precios">
                                            {t('magnet.cta_pricing')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {state === 'found' && result ? (
                            <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
                                {result.is_lost ? (
                                    <div className="flex items-start gap-3 border-b border-red-500/25 bg-red-500/10 px-5 py-4 text-red-900 dark:text-red-100">
                                        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold tracking-wide uppercase">
                                                {t('search_page.lost_banner')}
                                            </p>
                                            {locationBits.length > 0 ? (
                                                <p className="mt-1 text-sm opacity-90">
                                                    {locationBits.join(' · ')}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-b border-border/60 bg-brand-sky/8 px-5 py-3 text-sm text-brand-sky">
                                        {t('search_page.active_banner')}
                                    </div>
                                )}

                                <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
                                    <div
                                        className={cn(
                                            'flex aspect-[4/3] items-center justify-center bg-muted/40 sm:aspect-auto sm:min-h-[220px]',
                                        )}
                                    >
                                        {photo ? (
                                            <img
                                                src={photo}
                                                alt={result.name ?? ''}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <PawPrint className="size-14 text-brand-sky/35" />
                                        )}
                                    </div>

                                    <div className="px-5 py-5 md:px-6">
                                        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                                            {result.name}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {[
                                                result.species,
                                                result.breed,
                                                result.color,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>

                                        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    {t('search_page.fields.code')}
                                                </dt>
                                                <dd className="mt-0.5 font-medium">
                                                    {result.public_code}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    {t(
                                                        'search_page.fields.microchip',
                                                    )}
                                                </dt>
                                                <dd className="mt-0.5 font-medium tracking-wider">
                                                    {result.microchip_masked}
                                                </dd>
                                            </div>
                                            {result.clinic_name ? (
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                                                        {t(
                                                            'search_page.fields.clinic',
                                                        )}
                                                    </dt>
                                                    <dd className="mt-0.5 font-medium">
                                                        {result.clinic_name}
                                                    </dd>
                                                </div>
                                            ) : null}
                                            {(result.city ||
                                                result.country_code) && (
                                                <div>
                                                    <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                                                        {t(
                                                            'search_page.fields.location',
                                                        )}
                                                    </dt>
                                                    <dd className="mt-0.5 font-medium">
                                                        {[
                                                            result.city,
                                                            result.country_code,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        {result.is_lost &&
                                        result.lost?.public_notes ? (
                                            <p className="mt-4 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                                                {result.lost.public_notes}
                                            </p>
                                        ) : null}

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <Button
                                                asChild
                                                className="cursor-pointer rounded-2xl"
                                            >
                                                <a href={result.profile_url}>
                                                    {t(
                                                        'search_page.cta_profile',
                                                    )}
                                                    <ExternalLink className="size-4" />
                                                </a>
                                            </Button>
                                            {result.is_lost ? (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="cursor-pointer rounded-2xl border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
                                                >
                                                    <a
                                                        href={`${result.profile_url}#hallazgo`}
                                                    >
                                                        {t(
                                                            'search_page.cta_found',
                                                        )}
                                                    </a>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            <ClientMagnet />
        </PublicLayout>
    );
}
