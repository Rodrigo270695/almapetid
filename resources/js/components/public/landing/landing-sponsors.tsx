import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';

export type PublicSponsor = {
    code: string;
    name: string;
    tagline: string | null;
    url: string | null;
    logo_url: string | null;
    featured: boolean;
};

type Props = {
    sponsors: PublicSponsor[];
};

export function LandingSponsors({ sponsors }: Props) {
    const { t } = useTranslation('welcome');

    if (sponsors.length === 0) {
        return null;
    }

    return (
        <section className="border-b border-border/50 bg-muted/20 py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <Reveal>
                    <p className="text-sm font-medium tracking-wide text-brand-sky uppercase">
                        {t('sponsors.eyebrow')}
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {t('sponsors.title')}
                    </h2>
                    <p className="mt-3 max-w-2xl text-muted-foreground">
                        {t('sponsors.subtitle')}
                    </p>
                </Reveal>

                <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {sponsors.map((sponsor, index) => (
                        <Reveal key={sponsor.code} as="li" delay={index * 80}>
                            <article className="flex h-full flex-col rounded-[1.5rem] border border-border/70 bg-background px-5 py-5">
                                <p className="font-display text-xl font-semibold">
                                    {sponsor.name}
                                </p>
                                {sponsor.tagline ? (
                                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                        {sponsor.tagline}
                                    </p>
                                ) : null}
                                {sponsor.url ? (
                                    <a
                                        href={sponsor.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-sky hover:underline"
                                    >
                                        {t('sponsors.cta')}
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                ) : null}
                            </article>
                        </Reveal>
                    ))}
                </ul>
            </div>
        </section>
    );
}
