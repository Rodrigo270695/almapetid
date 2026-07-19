import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { cn } from '@/lib/utils';

export type PublicSponsor = {
    code: string;
    name: string;
    tagline: string | null;
    url: string | null;
    logo_url: string | null;
    featured: boolean;
};

export type PublicClinic = {
    id: number | string;
    name: string;
    city: string | null;
    logo_url: string;
    plan?: string | null;
    url?: string | null;
};

type Props = {
    sponsors: PublicSponsor[];
    clinics: PublicClinic[];
};

const SMALL_WORDS = new Set([
    'de',
    'del',
    'la',
    'las',
    'el',
    'los',
    'y',
    'e',
    'en',
    'a',
]);

function toTitleCaseEs(value: string): string {
    return value
        .toLocaleLowerCase('es')
        .split(' ')
        .map((word, index) => {
            if (index > 0 && SMALL_WORDS.has(word)) {
                return word;
            }
            if (word.length <= 2 && /^[a-z]+\.?$/i.test(word)) {
                return word.toLocaleUpperCase('es');
            }
            return word.charAt(0).toLocaleUpperCase('es') + word.slice(1);
        })
        .join(' ');
}

/** Nombre comercial limpio para la franja de red. */
function formatClinicName(raw: string): string {
    let name = raw.trim().replace(/\s+/g, ' ');

    name = name.replace(
        /^(cl[ií]nica(?:\s+veterinaria)?|veterinaria|vet\.?)\s+/i,
        '',
    );
    name = name.replace(
        /\s+(s\.?\s*a\.?\s*c\.?|s\.?\s*a\.?|e\.?\s*i\.?\s*r\.?\s*l\.?)$/i,
        '',
    );

    const words = name.split(' ');
    const deduped: string[] = [];
    for (const word of words) {
        const prev = deduped[deduped.length - 1];
        if (
            prev &&
            prev.toLocaleLowerCase('es') === word.toLocaleLowerCase('es')
        ) {
            continue;
        }
        deduped.push(word);
    }

    name = toTitleCaseEs(deduped.join(' '));

    if (name.length > 22) {
        const cut = name.slice(0, 21);
        const lastSpace = cut.lastIndexOf(' ');
        name = `${(lastSpace > 10 ? cut.slice(0, lastSpace) : cut).trim()}…`;
    }

    return name;
}

function MarqueeTrack({
    clinics,
    ariaHidden,
}: {
    clinics: PublicClinic[];
    ariaHidden?: boolean;
}) {
    return (
        <ul
            className="flex w-max items-stretch gap-3 pr-3 md:gap-4 md:pr-4"
            aria-hidden={ariaHidden || undefined}
        >
            {clinics.map((clinic, index) => {
                const label = formatClinicName(clinic.name);
                const content = (
                    <>
                        <div className="flex aspect-[5/3] w-full items-center justify-center rounded-xl bg-[#F7FAFC] px-5 py-4">
                            <img
                                src={clinic.logo_url}
                                alt={clinic.name}
                                title={clinic.name}
                                className="max-h-10 max-w-[128px] object-contain opacity-95 transition duration-300 group-hover:opacity-100 md:max-h-11"
                                loading="lazy"
                            />
                        </div>
                        <p
                            className="mt-3 truncate text-center text-[12.5px] font-medium tracking-tight text-white/80 transition group-hover:text-white"
                            title={clinic.name}
                        >
                            {label}
                        </p>
                    </>
                );

                return (
                    <li
                        key={`${clinic.id}-${index}-${ariaHidden ? 'b' : 'a'}`}
                        className="w-[152px] shrink-0 md:w-[168px]"
                    >
                        {clinic.url ? (
                            <a
                                href={clinic.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                            >
                                {content}
                            </a>
                        ) : (
                            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3.5">
                                {content}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Franja institucional: auspiciadores + directorio vivo de clínicas VetSaaS.
 */
export function LandingNetwork({ sponsors, clinics }: Props) {
    const { t } = useTranslation('welcome');

    const loopClinics = useMemo(() => {
        if (clinics.length === 0) {
            return [];
        }
        if (clinics.length >= 10) {
            return clinics;
        }
        const copies = Math.ceil(10 / clinics.length);
        return Array.from({ length: copies }, () => clinics).flat();
    }, [clinics]);

    if (sponsors.length === 0 && clinics.length === 0) {
        return null;
    }

    return (
        <section className="relative overflow-hidden border-y border-white/8 bg-[#081018] text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(14,116,144,0.16),transparent_60%)]"
            />

            <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24 lg:px-8">
                <Reveal className="mx-auto max-w-3xl text-center">
                    <p className="text-[11px] font-semibold tracking-[0.28em] text-cyan-300/80 uppercase">
                        {t('network.eyebrow')}
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance md:text-[2.75rem] md:leading-[1.15]">
                        {t('network.title')}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/58 md:text-base">
                        {t('network.subtitle')}
                    </p>
                </Reveal>

                {sponsors.length > 0 ? (
                    <div className="mt-14">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                            <p className="shrink-0 text-[10px] font-semibold tracking-[0.24em] text-white/35 uppercase">
                                {t('network.sponsors_label')}
                            </p>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        </div>

                        <ul
                            className={cn(
                                'mx-auto grid max-w-4xl gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10',
                                sponsors.length === 1
                                    ? 'grid-cols-1'
                                    : 'md:grid-cols-2',
                            )}
                        >
                            {sponsors.map((sponsor, index) => (
                                <Reveal key={sponsor.code} as="li" delay={index * 70}>
                                    <a
                                        href={sponsor.url ?? undefined}
                                        target={
                                            sponsor.url ? '_blank' : undefined
                                        }
                                        rel={
                                            sponsor.url
                                                ? 'noopener noreferrer'
                                                : undefined
                                        }
                                        className={cn(
                                            'group flex h-full min-h-[140px] flex-col justify-between gap-6 bg-[#0B1520] px-7 py-7 transition duration-300 hover:bg-[#0E1C2A]',
                                            !sponsor.url &&
                                                'pointer-events-none',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-12 items-center">
                                                {sponsor.logo_url ? (
                                                    <img
                                                        src={sponsor.logo_url}
                                                        alt={sponsor.name}
                                                        className="max-h-10 max-w-[140px] object-contain brightness-110"
                                                    />
                                                ) : (
                                                    <span className="font-display text-xl font-semibold">
                                                        {sponsor.name}
                                                    </span>
                                                )}
                                            </div>
                                            {sponsor.url ? (
                                                <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 text-white/45 transition group-hover:border-cyan-300/40 group-hover:text-cyan-200">
                                                    <ArrowUpRight className="size-4" />
                                                </span>
                                            ) : null}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold tracking-tight text-white">
                                                {sponsor.name}
                                            </p>
                                            {sponsor.tagline ? (
                                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/48">
                                                    {sponsor.tagline}
                                                </p>
                                            ) : null}
                                        </div>
                                    </a>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {loopClinics.length > 0 ? (
                    <div className="mt-16 md:mt-20">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-semibold tracking-[0.24em] text-white/35 uppercase">
                                        {t('network.clinics_label')}
                                    </p>
                                    <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/55 tabular-nums">
                                        {clinics.length}
                                    </span>
                                </div>
                            </div>
                            <a
                                href="/veterinarios"
                                className="group inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-cyan-200/90 transition hover:text-white"
                            >
                                {t('network.clinics_cta')}
                                <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>

                        <div className="rounded-[1.75rem] border border-white/8 bg-gradient-to-b from-white/[0.035] to-transparent px-2 py-6 md:px-3 md:py-7">
                            <div className="network-marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
                                <div className="network-marquee-row flex w-max">
                                    <MarqueeTrack clinics={loopClinics} />
                                    <MarqueeTrack
                                        clinics={loopClinics}
                                        ariaHidden
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
