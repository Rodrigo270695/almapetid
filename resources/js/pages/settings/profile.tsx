import { Form, Head, setLayoutProps, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizePhoneDigits } from '@/lib/phone';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { DOCUMENT_TYPES, type Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const { t } = useTranslation(['settings', 'auth', 'common']);
    const user = auth.user;
    const [phone, setPhone] = useState(() =>
        sanitizePhoneDigits(user?.phone ?? ''),
    );

    if (!user) {
        return null;
    }

    setLayoutProps({
        breadcrumbs: [
            {
                title: t('profile.title'),
                href: edit(),
            },
        ],
    });

    return (
        <>
            <Head title={t('profile.title')} />

            <h1 className="sr-only">{t('profile.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('profile.section_title')}
                    description={t('profile.section_description')}
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        {t('profile.name')}
                                    </Label>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="given-name"
                                        placeholder={t(
                                            'profile.name_placeholder',
                                        )}
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="lastname">
                                        {t('profile.lastname')}
                                    </Label>
                                    <Input
                                        id="lastname"
                                        className="mt-1 block w-full"
                                        defaultValue={user.lastname}
                                        name="lastname"
                                        required
                                        autoComplete="family-name"
                                        placeholder={t(
                                            'profile.lastname_placeholder',
                                        )}
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.lastname}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="document_type">
                                        {t('profile.document_type')}
                                    </Label>
                                    <select
                                        id="document_type"
                                        name="document_type"
                                        required
                                        defaultValue={
                                            user.document_type ?? ''
                                        }
                                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                    >
                                        <option value="" disabled>
                                            {t(
                                                'auth:common.document_type_placeholder',
                                            )}
                                        </option>
                                        {DOCUMENT_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {t(
                                                    `auth:common.document_types.${type}`,
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={errors.document_type}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="document_number">
                                        {t('profile.document_number')}
                                    </Label>
                                    <Input
                                        id="document_number"
                                        className="mt-1 block w-full"
                                        defaultValue={
                                            user.document_number ?? ''
                                        }
                                        name="document_number"
                                        required
                                        autoComplete="off"
                                        placeholder={t(
                                            'profile.document_number_placeholder',
                                        )}
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.document_number}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('profile.email')}
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('profile.email_placeholder')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">
                                    {t('profile.phone')}
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    name="phone"
                                    required
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(
                                            sanitizePhoneDigits(e.target.value),
                                        )
                                    }
                                    placeholder={t('profile.phone_placeholder')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('profile.phone_hint')}
                                </p>
                                <InputError
                                    className="mt-2"
                                    message={errors.phone}
                                />
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t('profile.unverified')}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t(
                                                    'profile.resend_verification',
                                                )}
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t(
                                                    'profile.verification_sent',
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('common:actions.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}
