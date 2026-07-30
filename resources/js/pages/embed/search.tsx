import { Head, router } from '@inertiajs/react';
import { AlertTriangle, PawPrint, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    clinic_ref?: string | null;
};

export default function EmbedSearch({
    q = null,
    state = 'empty',
    result = null,
    clinic_ref = null,
}: Props) {
    const { t } = useTranslation('welcome');
    const [query, setQuery] = useState(q ?? '');

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        const next = query.trim();
        const params: Record<string, string> = {};
        if (next) {
            params.q = next;
        }
        if (clinic_ref) {
            params.ref = clinic_ref;
        }
        router.get('/embed/buscar', params, {
            preserveState: true,
            replace: true,
        });
    };

    const photo = result?.lost?.photo_url || result?.photo_url || null;
    const meta = [result?.species, result?.breed, result?.color]
        .filter(Boolean)
        .join(' · ');

    return (
        <>
            <Head title={t('embed.title')} />
            <div className="min-h-screen bg-[#F7F9FB] text-foreground dark:bg-[#0a0a0a]">
                <div className="mx-auto w-full max-w-lg px-3 py-3 sm:px-4 sm:py-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="font-heading text-sm font-semibold tracking-tight text-brand-sky">
                            AlmaPet ID
                        </p>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t('embed.badge')}
                        </span>
                    </div>

                    <form
                        onSubmit={onSearch}
                        className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
                    >
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('hero.search_placeholder')}
                                className="h-11 w-full rounded-2xl border border-border/70 bg-card pr-3 pl-10 text-sm outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/35"
                                autoComplete="off"
                                inputMode="text"
                                name="q"
                                aria-label={t('hero.search_label')}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-11 cursor-pointer rounded-2xl bg-brand-sky px-5 text-white hover:bg-brand-sky/90"
                        >
                            {t('hero.search_cta')}
                        </Button>
                    </form>

                    <div className="mt-4">
                        {state === 'invalid' ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                                {t('search_page.invalid')}
                            </div>
                        ) : null}

                        {state === 'not_found' ? (
                            <div className="rounded-2xl border border-border/60 bg-card px-4 py-5 text-center text-sm text-muted-foreground">
                                {t('search_page.not_found_body', {
                                    q: q ?? query,
                                })}
                            </div>
                        ) : null}

                        {state === 'found' && result ? (
                            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                                {result.is_lost ? (
                                    <div className="flex items-start gap-2 border-b border-red-500/25 bg-red-500/10 px-4 py-3 text-red-800 dark:text-red-200">
                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                        <div className="min-w-0 text-sm">
                                            <p className="font-semibold uppercase tracking-wide">
                                                {t('embed.lost_alert')}
                                            </p>
                                            {(() => {
                                                const where = [
                                                    result.lost?.last_seen_city,
                                                    result.lost?.last_seen_zone,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ');
                                                return where ? (
                                                    <p className="mt-0.5 opacity-90">
                                                        {where}
                                                    </p>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="aspect-[16/10] bg-brand-sky/8">
                                    {photo ? (
                                        <img
                                            src={photo}
                                            alt={result.name ?? ''}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-brand-sky/40">
                                            <PawPrint className="size-14" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                                            {result.name}
                                        </h1>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                result.is_lost
                                                    ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                                    : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
                                            )}
                                        >
                                            {result.is_lost
                                                ? t('embed.status_lost')
                                                : t('embed.status_active')}
                                        </span>
                                    </div>

                                    {meta ? (
                                        <p className="text-sm text-muted-foreground">
                                            {meta}
                                        </p>
                                    ) : null}

                                    {result.clinic_name ? (
                                        <p className="text-xs text-muted-foreground">
                                            {t('embed.clinic', {
                                                name: result.clinic_name,
                                            })}
                                        </p>
                                    ) : null}

                                    <dl className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                                            <dt className="text-muted-foreground">
                                                {t('embed.code')}
                                            </dt>
                                            <dd className="mt-0.5 font-mono font-medium">
                                                {result.public_code}
                                            </dd>
                                        </div>
                                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                                            <dt className="text-muted-foreground">
                                                {t('embed.microchip')}
                                            </dt>
                                            <dd className="mt-0.5 font-mono font-medium">
                                                {result.microchip_masked}
                                            </dd>
                                        </div>
                                    </dl>

                                    {result.lost?.public_notes ? (
                                        <p className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                            {result.lost.public_notes}
                                        </p>
                                    ) : null}

                                    <a
                                        href={result.profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-2xl border border-border/70 bg-background text-sm font-medium hover:bg-muted/40"
                                    >
                                        {t('embed.open_full')}
                                    </a>
                                </div>
                            </div>
                        ) : null}

                        {state === 'empty' ? (
                            <p className="px-1 text-center text-xs text-muted-foreground">
                                {t('embed.hint')}
                            </p>
                        ) : null}
                    </div>

                    <p className="mt-4 text-center text-[10px] text-muted-foreground/80">
                        {t('embed.powered_by')}
                    </p>
                </div>
            </div>
        </>
    );
}
