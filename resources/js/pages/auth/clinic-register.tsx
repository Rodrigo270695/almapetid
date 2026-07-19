import { Form, Head, setLayoutProps } from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AuthNavLink from '@/components/auth/auth-nav-link';
import AuthWizardSteps from '@/components/auth/auth-wizard-steps';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
import OrganizationRucFields from '@/components/auth/organization-ruc-fields';
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
import {
    isPasswordStrong,
    passwordsMatch,
} from '@/lib/password-strength';
import { login } from '@/routes';
import { choose } from '@/routes/auth';
import { store } from '@/routes/clinic/register';
import type { DocumentType } from '@/types';

type Props = {
    passwordRules: string;
    departamentos: GeoOption[];
};

type OrgState = {
    ruc: string;
    organization_name: string;
    address: string;
};

type IdentityState = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

type Step = 1 | 2 | 3;

export default function ClinicRegister({
    passwordRules,
    departamentos,
}: Props) {
    const { t } = useTranslation('auth');
    const [step, setStep] = useState<Step>(1);
    const [org, setOrg] = useState<OrgState>({
        ruc: '',
        organization_name: '',
        address: '',
    });
    const [geo, setGeo] = useState<GeoCascadeValue>({
        departamento_id: null,
        provincia_id: null,
        distrito_id: null,
    });
    const [identity, setIdentity] = useState<IdentityState>({
        document_type: 'dni',
        document_number: '',
        name: '',
        lastname: '',
    });
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const wizardSteps = useMemo(
        () => [
            { id: 1, label: t('clinic.steps.org') },
            { id: 2, label: t('clinic.steps.admin') },
            { id: 3, label: t('clinic.steps.access') },
        ],
        [t],
    );

    setLayoutProps({
        title: t('clinic.title'),
        description: t(`clinic.step_subtitles.${step}`),
    });

    const goNext = () => {
        if (step === 1) {
            if (org.ruc.length !== 11) {
                toast.error(t('clinic.validation.ruc'));
                return;
            }
            if (!org.organization_name.trim()) {
                toast.error(t('clinic.validation.organization_name'));
                return;
            }
            if (geo.distrito_id === null) {
                toast.error(
                    t(
                        'clinic.validation.location',
                        'Selecciona departamento, provincia y distrito.',
                    ),
                );
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            const isDni = identity.document_type === 'dni';
            if (
                (isDni && identity.document_number.length !== 8) ||
                (!isDni && !identity.document_number.trim())
            ) {
                toast.error(t('clinic.validation.document'));
                return;
            }
            if (!identity.name.trim() || !identity.lastname.trim()) {
                toast.error(t('clinic.validation.names'));
                return;
            }
            setStep(3);
        }
    };

    const canSubmit =
        Boolean(email.trim()) &&
        isPasswordStrong(password) &&
        passwordsMatch(password, passwordConfirmation) &&
        geo.distrito_id !== null;

    return (
        <>
            <Head title={t('clinic.head_title')} />

            <AuthWizardSteps steps={wizardSteps} current={step} />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
                onError={(formErrors) => {
                    if (
                        formErrors.ruc ||
                        formErrors.organization_name ||
                        formErrors.address ||
                        formErrors.distrito_id ||
                        formErrors.departamento_id ||
                        formErrors.provincia_id
                    ) {
                        setStep(1);
                    } else if (
                        formErrors.document_type ||
                        formErrors.document_number ||
                        formErrors.name ||
                        formErrors.lastname
                    ) {
                        setStep(2);
                    } else {
                        setStep(3);
                    }
                }}
            >
                {({ processing, errors }) => (
                    <ClinicFormBody
                        step={step}
                        setStep={setStep}
                        org={org}
                        setOrg={setOrg}
                        geo={geo}
                        setGeo={setGeo}
                        departamentos={departamentos}
                        identity={identity}
                        setIdentity={setIdentity}
                        email={email}
                        setEmail={setEmail}
                        phone={phone}
                        setPhone={setPhone}
                        password={password}
                        setPassword={setPassword}
                        passwordConfirmation={passwordConfirmation}
                        setPasswordConfirmation={setPasswordConfirmation}
                        passwordRules={passwordRules}
                        processing={processing}
                        errors={errors}
                        goNext={goNext}
                        canSubmit={canSubmit}
                    />
                )}
            </Form>
        </>
    );
}

type BodyProps = {
    step: Step;
    setStep: Dispatch<SetStateAction<Step>>;
    org: OrgState;
    setOrg: Dispatch<SetStateAction<OrgState>>;
    geo: GeoCascadeValue;
    setGeo: Dispatch<SetStateAction<GeoCascadeValue>>;
    departamentos: GeoOption[];
    identity: IdentityState;
    setIdentity: Dispatch<SetStateAction<IdentityState>>;
    email: string;
    setEmail: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    passwordConfirmation: string;
    setPasswordConfirmation: (v: string) => void;
    passwordRules: string;
    processing: boolean;
    errors: Record<string, string>;
    goNext: () => void;
    canSubmit: boolean;
};

function ClinicFormBody({
    step,
    setStep,
    org,
    setOrg,
    geo,
    setGeo,
    departamentos,
    identity,
    setIdentity,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    passwordRules,
    processing,
    errors,
    goNext,
    canSubmit,
}: BodyProps) {
    const { t } = useTranslation('auth');

    useEffect(() => {
        if (
            errors.ruc ||
            errors.organization_name ||
            errors.address ||
            errors.distrito_id
        ) {
            setStep(1);
        } else if (
            errors.document_type ||
            errors.document_number ||
            errors.name ||
            errors.lastname
        ) {
            setStep(2);
        } else if (
            errors.email ||
            errors.password ||
            errors.password_confirmation ||
            errors.contact_phone
        ) {
            setStep(3);
        }
    }, [errors, setStep]);

    return (
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

            <div className={step === 1 ? 'grid gap-4' : 'hidden'}>
                <OrganizationRucFields
                    values={org}
                    onChange={(next) =>
                        setOrg((prev) => ({ ...prev, ...next }))
                    }
                    lookupUrl="/clinic/lookup-ruc"
                    errors={{
                        ruc: errors.ruc,
                        organization_name: errors.organization_name,
                        address: errors.address,
                    }}
                    tabIndexStart={1}
                />

                <div className="grid gap-2">
                    <Label>
                        {t('common.location', 'Ubicación')}
                    </Label>
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
            </div>

            <div className={step === 2 ? 'grid gap-4' : 'hidden'}>
                <DocumentIdentityFields
                    values={identity}
                    onChange={(next) =>
                        setIdentity((prev) => ({ ...prev, ...next }))
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
            </div>

            <div className={step === 3 ? 'grid gap-4' : 'hidden'}>
                <div className="grid gap-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        tabIndex={1}
                        autoComplete="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('common.email_placeholder')}
                        className={authFieldClassName}
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="contact_phone">
                        {t('clinic.contact_phone')}
                    </Label>
                    <Input
                        id="contact_phone"
                        name="contact_phone"
                        tabIndex={2}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('clinic.contact_phone_placeholder')}
                        className={authFieldClassName}
                    />
                    <InputError message={errors.contact_phone} />
                </div>

                <PasswordStrengthFields
                    password={password}
                    confirmation={passwordConfirmation}
                    onPasswordChange={setPassword}
                    onConfirmationChange={setPasswordConfirmation}
                    passwordError={errors.password}
                    confirmationError={errors.password_confirmation}
                    passwordRulesAttr={passwordRules}
                    tabIndexStart={3}
                />
            </div>

            <div className="flex flex-col gap-3 pt-1">
                {step < 3 ? (
                    <Button
                        type="button"
                        className={authSubmitClassName}
                        onClick={goNext}
                    >
                        {t('clinic.next')}
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        className={authSubmitClassName}
                        disabled={processing || !canSubmit}
                    >
                        {processing && <Spinner />}
                        {t('clinic.submit')}
                    </Button>
                )}

                {step > 1 ? (
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-2xl"
                        onClick={() => setStep((prev) => (prev - 1) as Step)}
                    >
                        {t('clinic.back')}
                    </Button>
                ) : null}
            </div>

            <div className="space-y-2 pt-1">
                <p className="text-center text-sm text-muted-foreground">
                    {t('clinic.has_account')}{' '}
                    <AuthNavLink
                        href={login()}
                        direction="to-login"
                        className="cursor-pointer"
                    >
                        {t('register.sign_in')}
                    </AuthNavLink>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                    {t('clinic.owner_cta')}{' '}
                    <AuthNavLink
                        href={choose()}
                        direction="to-register"
                        className="cursor-pointer"
                    >
                        {t('clinic.owner_link')}
                    </AuthNavLink>
                </p>
            </div>
        </>
    );
}
