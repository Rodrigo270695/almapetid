import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthNavLink from '@/components/auth/auth-nav-link';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
import PasswordStrengthFields from '@/components/auth/password-strength-fields';
import {
    GeoCascadeFields,
    type GeoCascadeValue,
    type GeoOption,
} from '@/components/geo/geo-cascade-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    authFieldClassName,
    authSubmitClassName,
} from '@/lib/auth-field-styles';
import { sanitizePhoneDigits } from '@/lib/phone';
import {
    isPasswordStrong,
    passwordsMatch,
} from '@/lib/password-strength';
import { login } from '@/routes';
import { choose } from '@/routes/auth';
import { store } from '@/routes/register';
import type { DocumentType } from '@/types';

type Props = {
    passwordRules: string;
    departamentos: GeoOption[];
};

type IdentityState = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

export default function Register({ passwordRules, departamentos }: Props) {
    const { t } = useTranslation('auth');
    const [identity, setIdentity] = useState<IdentityState>({
        document_type: 'dni',
        document_number: '',
        name: '',
        lastname: '',
    });
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [phone, setPhone] = useState('');
    const [geo, setGeo] = useState<GeoCascadeValue>({
        departamento_id: null,
        provincia_id: null,
        distrito_id: null,
    });

    setLayoutProps({
        title: t('register.title'),
        description: t('register.subtitle'),
    });

    const canSubmit =
        isPasswordStrong(password) &&
        passwordsMatch(password, passwordConfirmation) &&
        geo.distrito_id !== null;

    return (
        <>
            <Head title={t('register.head_title')} />
            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="departamento_id"
                            value={geo.departamento_id ?? ''}
                        />
                        <input
                            type="hidden"
                            name="provincia_id"
                            value={geo.provincia_id ?? ''}
                        />
                        <input
                            type="hidden"
                            name="distrito_id"
                            value={geo.distrito_id ?? ''}
                        />

                        <div className="grid gap-4">
                            <DocumentIdentityFields
                                values={identity}
                                onChange={(next) =>
                                    setIdentity((prev) => ({
                                        ...prev,
                                        ...next,
                                    }))
                                }
                                lookupUrl="/register/lookup-dni"
                                errors={{
                                    document_type: errors.document_type,
                                    document_number: errors.document_number,
                                    name: errors.name,
                                    lastname: errors.lastname,
                                }}
                                tabIndexStart={1}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('common.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={6}
                                    autoComplete="email"
                                    name="email"
                                    placeholder={t('common.email_placeholder')}
                                    className={authFieldClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t('common.phone')}</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    tabIndex={7}
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    name="phone"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(
                                            sanitizePhoneDigits(e.target.value),
                                        )
                                    }
                                    placeholder={t('common.phone_placeholder')}
                                    className={authFieldClassName}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('common.phone_hint')}
                                </p>
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label>
                                    {t('common.location', 'Ubicación')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'common.location_hint',
                                        'Selecciona departamento, provincia y distrito.',
                                    )}
                                </p>
                                <GeoCascadeFields
                                    departamentos={departamentos}
                                    value={geo}
                                    onChange={setGeo}
                                    errors={{
                                        departamento_id: errors.departamento_id,
                                        provincia_id: errors.provincia_id,
                                        distrito_id: errors.distrito_id,
                                    }}
                                    disabled={processing}
                                />
                            </div>

                            <PasswordStrengthFields
                                password={password}
                                confirmation={passwordConfirmation}
                                onPasswordChange={setPassword}
                                onConfirmationChange={setPasswordConfirmation}
                                passwordError={errors.password}
                                confirmationError={
                                    errors.password_confirmation
                                }
                                passwordRulesAttr={passwordRules}
                                tabIndexStart={8}
                            />

                            <Button
                                type="submit"
                                className={authSubmitClassName}
                                tabIndex={10}
                                disabled={processing || !canSubmit}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('register.submit')}
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('register.has_account')}{' '}
                            <AuthNavLink
                                href={login()}
                                direction="to-login"
                                tabIndex={10}
                                className="cursor-pointer"
                            >
                                {t('register.sign_in')}
                            </AuthNavLink>
                        </p>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('register.wrong_path')}{' '}
                            <AuthNavLink
                                href={choose()}
                                direction="to-register"
                                tabIndex={11}
                                className="cursor-pointer"
                            >
                                {t('register.choose_again')}
                            </AuthNavLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}
