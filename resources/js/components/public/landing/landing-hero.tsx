import { Link, router } from '@inertiajs/react';
import { ArrowDown, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BrandWordmark from '@/components/brand-wordmark';
import { Button } from '@/components/ui/button';
import {
    usePrefersReducedMotion,
    useScrollY,
} from '@/hooks/use-scroll-y';
import { choose } from '@/routes/auth';

export function LandingHero() {
    const { t } = useTranslation('welcome');
    const [query, setQuery] = useState('');
    const scrollY = useScrollY();
    const reduced = usePrefersReducedMotion();

    const parallax = reduced ? 0 : Math.min(scrollY * 0.35, 140);
    const fade = reduced ? 1 : Math.max(1 - scrollY / 520, 0);

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        router.get('/buscar', { q }, { preserveState: false });
    };

    return (
        <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#0A1A24] text-white">
            <div
                className="absolute inset-0 will-change-transform"
                style={{
                    transform: `translate3d(0, ${parallax}px, 0) scale(${1 + (reduced ? 0 : scrollY * 0.00015)})`,
                }}
            >
                <img
                    src="/images/landing-hero.jpg"
                    alt=""
                    className="size-full object-cover object-[68%_center]"
                    style={{
                        animation: reduced
                            ? undefined
                            : 'landing-kenburns 28s ease-out forwards',
                    }}
                />
            </div>
            <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[#0A1A24] via-[#0A1A24]/88 to-[#0A1A24]/25"
            />
            <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0A1A24] via-transparent to-[#0A1A24]/45"
            />

            <div
                className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-20 pt-28 md:justify-center md:px-6 md:pb-28 md:pt-32 lg:px-8"
                style={{ opacity: fade }}
            >
                <div className="max-w-xl landing-hero-copy">
                    <BrandWordmark
                        variant="white"
                        className="h-11 md:h-12 lg:h-14"
                        alt="AlmaPet ID"
                    />
                    <h1 className="mt-7 font-display text-[2.15rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                        {t('hero.headline')}
                    </h1>
                    <p className="mt-5 max-w-md text-base leading-relaxed text-white/78 md:text-lg">
                        {t('hero.subhead')}
                    </p>

                    <form
                        onSubmit={onSearch}
                        className="mt-9 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-stretch"
                    >
                        <label className="sr-only" htmlFor="landing-search">
                            {t('hero.search_label')}
                        </label>
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/45" />
                            <input
                                id="landing-search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('hero.search_placeholder')}
                                className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 pr-3 pl-11 text-sm text-white placeholder:text-white/45 outline-none backdrop-blur-md transition focus:border-brand-sky focus:bg-white/14 focus:ring-2 focus:ring-brand-sky/35"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-12 cursor-pointer rounded-2xl bg-brand-sky px-6 text-white hover:bg-brand-sky/90"
                        >
                            {t('hero.search_cta')}
                        </Button>
                    </form>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 cursor-pointer rounded-2xl bg-white px-6 text-[#0A1A24] hover:bg-white/90"
                        >
                            <Link href={choose()}>{t('hero.cta_primary')}</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="h-12 cursor-pointer rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                        >
                            <a href="/perdidos">{t('hero.cta_lost')}</a>
                        </Button>
                    </div>
                </div>
            </div>

            <a
                href="/por-que"
                className="absolute bottom-6 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1 text-white/55 transition hover:text-white"
                style={{ opacity: fade }}
                aria-label={t('nav.why')}
            >
                <span className="text-[11px] tracking-[0.18em] uppercase">
                    Scroll
                </span>
                <ArrowDown className="size-4 animate-bounce" />
            </a>
        </section>
    );
}
