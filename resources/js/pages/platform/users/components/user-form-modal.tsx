import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { sanitizePhoneDigits } from '@/lib/phone';
import { DOCUMENT_TYPES } from '@/types';
import users from '@/routes/platform/users';
import type { PlatformUser, UserRoleOption } from '../types';

export type UserFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: PlatformUser | null;
    rolesCatalog: readonly UserRoleOption[];
};

type UserFormData = {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    password: string;
    password_confirmation: string;
    role: string;
};

const emptyForm: UserFormData = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    document_type: '',
    document_number: '',
    password: '',
    password_confirmation: '',
    role: '',
};

const buildInitialData = (user: PlatformUser | null): UserFormData => ({
    name: user?.name ?? '',
    lastname: user?.lastname ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    document_type: user?.document_type ?? '',
    document_number: user?.document_number ?? '',
    password: '',
    password_confirmation: '',
    role: user?.roles[0]?.name ?? '',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFormValid = (data: UserFormData, isEdit: boolean): boolean => {
    if (data.name.trim().length < 2) return false;
    if (data.lastname.trim().length < 2) return false;
    if (!EMAIL_REGEX.test(data.email.trim())) return false;
    if (data.phone.trim().length < 7) return false;
    if (!data.role) return false;
    if (!isEdit) {
        if (data.password.length < 8) return false;
        if (data.password !== data.password_confirmation) return false;
    } else if (data.password.length > 0) {
        if (data.password.length < 8) return false;
        if (data.password !== data.password_confirmation) return false;
    }
    return true;
};

export function UserFormModal({
    open,
    onOpenChange,
    user,
    rolesCatalog,
}: UserFormModalProps) {
    const { t } = useTranslation(['usuarios', 'common']);
    const isEdit = user !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserFormData>(emptyForm);

    const canSubmit = isFormValid(data, isEdit) && !processing;
    const initialSnapshotRef = useRef<UserFormData>(emptyForm);

    useEffect(() => {
        if (open) {
            const initial = buildInitialData(user);
            initialSnapshotRef.current = initial;
            (Object.keys(initial) as Array<keyof UserFormData>).forEach(
                (key) => {
                    setData(key, initial[key]);
                },
            );
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    const isDirty = useMemo(() => {
        const initial = initialSnapshotRef.current;
        return (
            initial.name !== data.name ||
            initial.lastname !== data.lastname ||
            initial.email !== data.email ||
            initial.phone !== data.phone ||
            initial.document_type !== data.document_type ||
            initial.document_number !== data.document_number ||
            initial.role !== data.role ||
            data.password.length > 0
        );
    }, [data]);

    const confirmDiscard = (): boolean => {
        if (!isDirty) return true;
        return window.confirm(t('common:form.unsaved_changes'));
    };

    const handleClose = (next: boolean) => {
        if (!next) {
            if (!confirmDiscard()) return;
            reset();
            clearErrors();
        }
        onOpenChange(next);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const onSuccess = () => {
            reset();
            clearErrors();
            onOpenChange(false);
        };

        if (isEdit && user) {
            put(users.update(user.id).url, {
                preserveScroll: true,
                onSuccess,
            });
        } else {
            post(users.store().url, {
                preserveScroll: true,
                onSuccess,
            });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={
                isEdit
                    ? t('usuarios:form.title_edit')
                    : t('usuarios:form.title_create')
            }
            description={
                isEdit
                    ? t('usuarios:form.description_edit')
                    : t('usuarios:form.description_create')
            }
            size="lg"
            onSubmit={onSubmit}
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={processing}
                        className="cursor-pointer"
                    >
                        {t('common:actions.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90 disabled:cursor-not-allowed"
                    >
                        {processing && (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                        )}
                        {isEdit
                            ? t('usuarios:form.submit_edit')
                            : t('usuarios:form.submit_create')}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    title={t('usuarios:form.section_basic')}
                    description={t('usuarios:form.section_basic_hint')}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            id="user-name"
                            label={t('usuarios:form.fields.name')}
                            required
                            error={errors.name}
                        >
                            <Input
                                id="user-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t(
                                    'usuarios:form.fields.name_placeholder',
                                )}
                                autoComplete="given-name"
                                autoFocus
                            />
                        </FormField>
                        <FormField
                            id="user-lastname"
                            label={t('usuarios:form.fields.lastname')}
                            required
                            error={errors.lastname}
                        >
                            <Input
                                id="user-lastname"
                                value={data.lastname}
                                onChange={(e) =>
                                    setData('lastname', e.target.value)
                                }
                                placeholder={t(
                                    'usuarios:form.fields.lastname_placeholder',
                                )}
                                autoComplete="family-name"
                            />
                        </FormField>
                    </div>

                    <FormField
                        id="user-email"
                        label={t('usuarios:form.fields.email')}
                        required
                        error={errors.email}
                    >
                        <Input
                            id="user-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t(
                                'usuarios:form.fields.email_placeholder',
                            )}
                            autoComplete="email"
                        />
                    </FormField>

                    <FormField
                        id="user-phone"
                        label={t('usuarios:form.fields.phone')}
                        required
                        error={errors.phone}
                        hint={t('usuarios:form.fields.phone_hint')}
                    >
                        <Input
                            id="user-phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) =>
                                setData(
                                    'phone',
                                    sanitizePhoneDigits(e.target.value),
                                )
                            }
                            placeholder={t(
                                'usuarios:form.fields.phone_placeholder',
                            )}
                            inputMode="numeric"
                            autoComplete="tel"
                        />
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            id="user-document-type"
                            label={t('usuarios:form.fields.document_type')}
                            error={errors.document_type}
                        >
                            <Select
                                value={data.document_type || undefined}
                                onValueChange={(v) =>
                                    setData('document_type', v)
                                }
                            >
                                <SelectTrigger
                                    id="user-document-type"
                                    className="w-full cursor-pointer"
                                >
                                    <SelectValue
                                        placeholder={t(
                                            'usuarios:form.fields.document_type_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map((type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            className="cursor-pointer"
                                        >
                                            {t(
                                                `usuarios:document_types.${type}`,
                                                type,
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            id="user-document-number"
                            label={t('usuarios:form.fields.document_number')}
                            error={errors.document_number}
                        >
                            <Input
                                id="user-document-number"
                                value={data.document_number}
                                onChange={(e) =>
                                    setData('document_number', e.target.value)
                                }
                                placeholder={t(
                                    'usuarios:form.fields.document_number_placeholder',
                                )}
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    index={1}
                    title={t('usuarios:form.section_access')}
                    description={
                        isEdit
                            ? t('usuarios:form.section_access_hint_edit')
                            : t('usuarios:form.section_access_hint_create')
                    }
                >
                    <FormField
                        id="user-role"
                        label={t('usuarios:form.fields.role')}
                        required
                        error={errors.role}
                    >
                        <Select
                            value={data.role || undefined}
                            onValueChange={(v) => setData('role', v)}
                        >
                            <SelectTrigger
                                id="user-role"
                                className="w-full cursor-pointer"
                            >
                                <SelectValue
                                    placeholder={t(
                                        'usuarios:form.fields.role_placeholder',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {rolesCatalog.map((role) => (
                                    <SelectItem
                                        key={role.id}
                                        value={role.name}
                                        className="cursor-pointer"
                                    >
                                        <span className="font-mono text-xs">
                                            {role.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            id="user-password"
                            label={t('usuarios:form.fields.password')}
                            required={!isEdit}
                            error={errors.password}
                            hint={
                                isEdit
                                    ? t('usuarios:form.fields.password_hint_edit')
                                    : undefined
                            }
                        >
                            <Input
                                id="user-password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField
                            id="user-password-confirmation"
                            label={t(
                                'usuarios:form.fields.password_confirmation',
                            )}
                            required={!isEdit}
                            error={errors.password_confirmation}
                        >
                            <Input
                                id="user-password-confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                </FormSection>
            </div>
        </FormModal>
    );
}
