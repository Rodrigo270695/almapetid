import { Link } from '@inertiajs/react';
import { Building2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/public/motion/reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { register as clinicRegister } from '@/routes/clinic';

type Props = { embedded?: boolean };

export function LandingAudiences({ embedded = false }: Props) {
    const { t } = useTranslation('welcome');

    return (
        <section
            id={embedded ? undefined : 'duenos-clinicas'}
            className="scroll-mt-24 border-b border-border/50 bg-brand-sky-soft/35 py-20 md:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                {!embedded ? (
                    <Reveal className="max-w-2xl">
                        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                            {t('audiences.title')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                            {t('audiences.subtitle')}
                        </p>
                    </Reveal>
                ) : null}

                <div
                    className={cn(
                        'grid gap-6 lg:grid-cols-2 lg:gap-8',
                        embedded ? 'mt-0' : 'mt-14',
                    )}
                >
                    <Reveal delay={40} from="left">
                        <AudienceBlock
                            icon={Heart}
                            accent="owner"
                            title={t('audiences.owner.title')}
                            body={t('audiences.owner.body')}
                            cta={t('audiences.owner.cta')}
                            href={register()}
                        />
                    </Reveal>
                    <Reveal delay={120} from="right">
                        <AudienceBlock
                            icon={Building2}
                            accent="clinic"
                            title={t('audiences.clinic.title')}
                            body={t('audiences.clinic.body')}
                            cta={t('audiences.clinic.cta')}
                            href={clinicRegister()}
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function AudienceBlock({
    icon: Icon,
    accent,
    title,
    body,
    cta,
    href,
}: {
    icon: typeof Heart;
    accent: 'owner' | 'clinic';
    title: string;
    body: string;
    cta: string;
    href: string;
}) {
    return (
        <div
            className={cn(
                'group h-full rounded-[2rem] border p-7 transition duration-300 md:p-9',
                'hover:-translate-y-1 hover:shadow-[0_30px_60px_-35px_rgba(0,80,110,0.35)]',
                accent === 'owner' &&
                    'border-brand-sky/25 bg-background/85 hover:border-brand-sky/45',
                accent === 'clinic' &&
                    'border-border/70 bg-background/65 hover:border-foreground/20',
            )}
        >
            <span
                className={cn(
                    'flex size-12 items-center justify-center rounded-2xl transition group-hover:scale-105',
                    accent === 'owner' && 'bg-brand-sky/15 text-brand-sky',
                    accent === 'clinic' && 'bg-muted text-foreground',
                )}
            >
                <Icon className="size-5" strokeWidth={2} />
            </span>
            <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {body}
            </p>
            <Button
                asChild
                className={cn(
                    'mt-7 h-11 cursor-pointer rounded-2xl',
                    accent === 'owner'
                        ? 'bg-brand-sky text-white hover:bg-brand-sky/90'
                        : 'bg-foreground text-background hover:bg-foreground/90',
                )}
            >
                <Link href={href}>{cta}</Link>
            </Button>
        </div>
    );
}
