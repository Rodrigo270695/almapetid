import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthNavLink from '@/components/auth/auth-nav-link';
import GoogleSignInButton from '@/components/auth/google-sign-in-button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    authFieldClassName,
    authSubmitClassName,
} from '@/lib/auth-field-styles';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { choose } from '@/routes/auth';

type Props = {
    status?: string;
    error?: string;
    canResetPassword: boolean;
    canLoginWithGoogle?: boolean;
};

export default function Login({
    status,
    error: initialError,
    canResetPassword,
    canLoginWithGoogle = true,
}: Props) {
    const { t } = useTranslation('auth');
    const [error, setError] = useState(initialError);

    setLayoutProps({
        title: t('login.title'),
        description: t('login.subtitle'),
    });

    return (
        <>
            <Head title={t('login.head_title')} />

            {error ? (
                <div
                    role="alert"
                    className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-sm font-medium text-destructive"
                >
                    {error}
                </div>
            ) : null}

            {status ? (
                <div className="mb-5 rounded-2xl border border-brand-sky/20 bg-brand-sky-soft/80 px-3.5 py-2.5 text-center text-sm font-medium text-brand-sky">
                    {status}
                </div>
            ) : null}

            {canLoginWithGoogle ? (
                <div className="space-y-2">
                    <GoogleSignInButton onError={setError} />
                    <p className="text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {t('login.google_hint')}
                    </p>
                </div>
            ) : null}

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full opacity-60" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold tracking-[0.16em] uppercase">
                    <span
                        className="rounded-full px-3 py-0.5 text-muted-foreground"
                        style={{ background: 'var(--glass-chip)' }}
                    >
                        {t('common.or_email')}
                    </span>
                </div>
            </div>

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('common.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t('common.email_placeholder')}
                                    className={authFieldClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="password">
                                        {t('common.password')}
                                    </Label>
                                    {canResetPassword && (
                                        <AuthNavLink
                                            href={request()}
                                            direction="to-forgot"
                                            className="ml-auto cursor-pointer text-sm"
                                            tabIndex={5}
                                        >
                                            {t('login.forgot_password')}
                                        </AuthNavLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t(
                                        'common.password_placeholder',
                                    )}
                                    className={authFieldClassName}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 pt-0.5 select-none">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="size-[1.125rem] cursor-pointer rounded-md"
                                />
                                <span className="text-sm font-normal text-muted-foreground">
                                    {t('common.remember')}
                                </span>
                            </label>

                            <Button
                                type="submit"
                                className={authSubmitClassName}
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('login.submit')}
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('login.no_account')}{' '}
                            <AuthNavLink
                                href={choose()}
                                direction="to-register"
                                tabIndex={5}
                                className="cursor-pointer"
                            >
                                {t('login.sign_up')}
                            </AuthNavLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}
