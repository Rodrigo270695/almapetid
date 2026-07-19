import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
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
import type { DocumentType } from '@/types';

type Props = {
    user: {
        name: string;
        lastname: string;
        email: string;
    };
    departamentos: GeoOption[];
};

export default function CompleteDocument({ user, departamentos }: Props) {
    const { t } = useTranslation('auth');
    const [identity, setIdentity] = useState({
        document_type: 'dni' as DocumentType,
        document_number: '',
        name: user.name ?? '',
        lastname: user.lastname ?? '',
    });
    const [phone, setPhone] = useState('');
    const [geo, setGeo] = useState<GeoCascadeValue>({
        departamento_id: null,
        provincia_id: null,
        distrito_id: null,
    });

    setLayoutProps({
        title: t('onboarding.title'),
        description: t('onboarding.subtitle', { email: user.email }),
    });

    const canSubmit = geo.distrito_id !== null;

    return (
        <>
            <Head title={t('onboarding.head_title')} />

            <Form
                action="/onboarding/document"
                method="post"
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

                        <p className="rounded-2xl border border-brand-sky/20 bg-brand-sky-soft/70 px-3.5 py-2.5 text-sm text-brand-sky">
                            {t('onboarding.hint')}
                        </p>

                        <DocumentIdentityFields
                            values={identity}
                            onChange={(next) =>
                                setIdentity((prev) => ({ ...prev, ...next }))
                            }
                            lookupUrl="/document/lookup-dni"
                            errors={{
                                document_type: errors.document_type,
                                document_number: errors.document_number,
                                name: errors.name,
                                lastname: errors.lastname,
                            }}
                            tabIndexStart={1}
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="phone">{t('common.phone')}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                name="phone"
                                required
                                inputMode="numeric"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(sanitizePhoneDigits(e.target.value))
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

                        <Button
                            type="submit"
                            className={authSubmitClassName}
                            disabled={processing || !canSubmit}
                        >
                            {processing && <Spinner />}
                            {t('onboarding.submit')}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
