import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthNavLink from '@/components/auth/auth-nav-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    authFieldClassName,
    authSubmitClassName,
} from '@/lib/auth-field-styles';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation('auth');

    setLayoutProps({
        title: t('forgot_password.title'),
        description: t('forgot_password.subtitle'),
    });

    return (
        <>
            <Head title={t('forgot_password.head_title')} />

            {status ? (
                <div className="mb-5 rounded-2xl border border-brand-sky/20 bg-brand-sky-soft/80 px-3.5 py-2.5 text-center text-sm font-medium text-brand-sky">
                    {status}
                </div>
            ) : null}

            <Form {...email.form()} className="flex flex-col gap-5">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('common.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder={t('common.email_placeholder')}
                                    className={authFieldClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className={authSubmitClassName}
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner />}
                                {t('forgot_password.submit')}
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('forgot_password.back_to_login')}{' '}
                            <AuthNavLink
                                href={login()}
                                direction="from-forgot"
                                className="cursor-pointer"
                            >
                                {t('forgot_password.back_link')}
                            </AuthNavLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}
