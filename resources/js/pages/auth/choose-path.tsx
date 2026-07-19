import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { Heart, Syringe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthNavLink from '@/components/auth/auth-nav-link';
import { prepareAuthNav } from '@/lib/auth-nav';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { register as clinicRegister } from '@/routes/clinic';

type PathCardProps = {
    href: string;
    icon: typeof Heart;
    title: string;
    description: string;
    cta: string;
    accent: 'owner' | 'clinic';
};

function PathCard({
    href,
    icon: Icon,
    title,
    description,
    cta,
    accent,
}: PathCardProps) {
    return (
        <Link
            href={href}
            onClick={() => prepareAuthNav('to-register')}
            className={cn(
                'group block cursor-pointer rounded-2xl border p-5 text-left no-underline transition-all duration-200',
                'hover:scale-[1.01] hover:shadow-md active:scale-[0.99]',
                accent === 'owner' &&
                    'border-brand-sky/25 bg-brand-sky-soft/40 hover:border-brand-sky/45 hover:bg-brand-sky-soft/70',
                accent === 'clinic' &&
                    'border-border/70 bg-background/50 hover:border-foreground/20 hover:bg-background/80',
            )}
        >
            <span
                className={cn(
                    'mb-3 flex size-11 items-center justify-center rounded-2xl',
                    accent === 'owner' && 'bg-brand-sky/15 text-brand-sky',
                    accent === 'clinic' && 'bg-muted text-foreground',
                )}
            >
                <Icon className="size-5" strokeWidth={2} />
            </span>
            <span className="block font-display text-lg font-semibold tracking-tight text-foreground">
                {title}
            </span>
            <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                {description}
            </span>
            <span
                className={cn(
                    'mt-4 inline-flex text-sm font-semibold',
                    accent === 'owner' ? 'text-brand-sky' : 'text-foreground',
                )}
            >
                {cta}
                <span className="ml-1 transition-transform group-hover:translate-x-0.5">
                    →
                </span>
            </span>
        </Link>
    );
}

export default function ChoosePath() {
    const { t } = useTranslation('auth');

    setLayoutProps({
        title: t('choose.title'),
        description: t('choose.subtitle'),
    });

    return (
        <>
            <Head title={t('choose.head_title')} />

            <div className="grid gap-3">
                <PathCard
                    href={register()}
                    icon={Heart}
                    title={t('choose.owner_title')}
                    description={t('choose.owner_body')}
                    cta={t('choose.owner_cta')}
                    accent="owner"
                />
                <PathCard
                    href={clinicRegister()}
                    icon={Syringe}
                    title={t('choose.clinic_title')}
                    description={t('choose.clinic_body')}
                    cta={t('choose.clinic_cta')}
                    accent="clinic"
                />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {t('choose.has_account')}{' '}
                <AuthNavLink
                    href={login()}
                    direction="to-login"
                    className="cursor-pointer"
                >
                    {t('register.sign_in')}
                </AuthNavLink>
            </p>
        </>
    );
}
