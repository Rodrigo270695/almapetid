import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import payments from '@/routes/platform/payments';
import type {
    PlanCatalogItem,
    RegistrationPayment,
    UserCatalogItem,
} from '../types';

export type PaymentFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: RegistrationPayment | null;
    plansCatalog: readonly PlanCatalogItem[];
    usersCatalog: readonly UserCatalogItem[];
};

type FormData = {
    plan_id: string;
    user_id: string;
    amount: string;
    currency: 'PEN' | 'USD';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    provider: 'manual' | 'culqi' | 'niubiz' | 'stripe';
    provider_reference: string;
    notes: string;
};

const empty: FormData = {
    plan_id: '',
    user_id: '',
    amount: '',
    currency: 'PEN',
    status: 'pending',
    provider: 'manual',
    provider_reference: '',
    notes: '',
};

const buildInitial = (payment: RegistrationPayment | null): FormData =>
    payment
        ? {
              plan_id: payment.plan_id != null ? String(payment.plan_id) : '',
              user_id: payment.user_id != null ? String(payment.user_id) : '',
              amount: String(payment.amount),
              currency: payment.currency,
              status: payment.status,
              provider: payment.provider,
              provider_reference: payment.provider_reference ?? '',
              notes: payment.notes ?? '',
          }
        : empty;

export function PaymentFormModal({
    open,
    onOpenChange,
    payment,
    plansCatalog,
    usersCatalog,
}: PaymentFormModalProps) {
    const { t } = useTranslation(['payments', 'common']);
    const isEdit = payment !== null;
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm<FormData>(empty);

    const initialRef = useRef<FormData>(empty);

    useEffect(() => {
        if (!open) return;
        const initial = buildInitial(payment);
        initialRef.current = initial;
        (Object.keys(initial) as Array<keyof FormData>).forEach((key) => {
            setData(key, initial[key]);
        });
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, payment?.id]);

    const canSubmit = useMemo(() => {
        const amount = Number(data.amount);
        return Number.isFinite(amount) && amount > 0 && !processing;
    }, [data.amount, processing]);

    const userOptions = useMemo<readonly ComboboxOption[]>(
        () =>
            usersCatalog.map((u) => ({
                value: String(u.id),
                label: `${u.name} ${u.lastname} · ${u.email}`.trim(),
            })),
        [usersCatalog],
    );

    const handleClose = (next: boolean) => {
        if (!next) {
            reset();
            clearErrors();
        }
        onOpenChange(next);
    };

    const onPlanChange = (planId: string) => {
        setData('plan_id', planId);
        const plan = plansCatalog.find((p) => String(p.id) === planId);
        if (plan) {
            setData('amount', String(plan.amount));
            setData('currency', plan.currency);
        }
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        transform((form) => ({
            plan_id: form.plan_id ? Number(form.plan_id) : null,
            user_id: form.user_id ? Number(form.user_id) : null,
            organization_id: null,
            chip_registration_id: payment?.chip_registration_id ?? null,
            amount: Number(form.amount),
            currency: form.currency,
            status: form.status,
            provider: form.provider,
            provider_reference: form.provider_reference || null,
            notes: form.notes || null,
            paid_at: null,
        }));

        const onSuccess = () => {
            reset();
            clearErrors();
            onOpenChange(false);
        };

        if (isEdit && payment) {
            put(payments.update(payment.id).url, {
                preserveScroll: true,
                onSuccess,
            });
        } else {
            formPost();
        }

        function formPost() {
            post(payments.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={
                isEdit
                    ? t('payments:form.title_edit')
                    : t('payments:form.title_create')
            }
            description={
                isEdit
                    ? t('payments:form.description_edit')
                    : t('payments:form.description_create')
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
                        className="cursor-pointer gap-2 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : null}
                        {isEdit
                            ? t('payments:form.submit_edit')
                            : t('payments:form.submit_create')}
                    </Button>
                </>
            }
        >
            <FormSection
                title={t('payments:form.section_basic')}
                description={t('payments:form.section_basic_hint')}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="pay-plan"
                        label={t('payments:form.fields.plan')}
                        error={errors.plan_id}
                    >
                        <Select
                            value={data.plan_id || '__none__'}
                            onValueChange={(v) =>
                                onPlanChange(v === '__none__' ? '' : v)
                            }
                            disabled={processing}
                        >
                            <SelectTrigger id="pay-plan" className="w-full">
                                <SelectValue
                                    placeholder={t(
                                        'payments:form.fields.plan_placeholder',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">
                                    {t('payments:form.fields.plan_none')}
                                </SelectItem>
                                {plansCatalog.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} ({p.currency} {p.amount})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="pay-user"
                        label={t('payments:form.fields.user')}
                        error={errors.user_id}
                    >
                        <Combobox
                            id="pay-user"
                            options={userOptions}
                            value={data.user_id || null}
                            onChange={(v) => setData('user_id', v ?? '')}
                            placeholder={t(
                                'payments:form.fields.user_placeholder',
                            )}
                            searchPlaceholder={t(
                                'payments:form.fields.user_search',
                            )}
                            emptyMessage={t('payments:form.fields.user_empty')}
                            clearable
                            disabled={processing}
                            aria-invalid={Boolean(errors.user_id)}
                        />
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="pay-amount"
                        label={t('payments:form.fields.amount')}
                        error={errors.amount}
                        required
                    >
                        <Input
                            id="pay-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            disabled={processing}
                        />
                    </FormField>
                    <FormField
                        id="pay-currency"
                        label={t('payments:form.fields.currency')}
                        error={errors.currency}
                        required
                    >
                        <Select
                            value={data.currency}
                            onValueChange={(v) =>
                                setData('currency', v as 'PEN' | 'USD')
                            }
                            disabled={processing}
                        >
                            <SelectTrigger id="pay-currency" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PEN">PEN</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="pay-status"
                        label={t('payments:form.fields.status')}
                        error={errors.status}
                        required
                    >
                        <Select
                            value={data.status}
                            onValueChange={(v) =>
                                setData('status', v as FormData['status'])
                            }
                            disabled={processing}
                        >
                            <SelectTrigger id="pay-status" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    [
                                        'pending',
                                        'paid',
                                        'failed',
                                        'refunded',
                                    ] as const
                                ).map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {t(`payments:status.${s}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField
                        id="pay-provider"
                        label={t('payments:form.fields.provider')}
                        error={errors.provider}
                        required
                    >
                        <Select
                            value={data.provider}
                            onValueChange={(v) =>
                                setData('provider', v as FormData['provider'])
                            }
                            disabled={processing}
                        >
                            <SelectTrigger id="pay-provider" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    [
                                        'manual',
                                        'culqi',
                                        'niubiz',
                                        'stripe',
                                    ] as const
                                ).map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {t(`payments:providers.${p}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <FormField
                    id="pay-ref"
                    label={t('payments:form.fields.provider_reference')}
                    error={errors.provider_reference}
                >
                    <Input
                        id="pay-ref"
                        value={data.provider_reference}
                        onChange={(e) =>
                            setData('provider_reference', e.target.value)
                        }
                        placeholder={t(
                            'payments:form.fields.provider_reference_placeholder',
                        )}
                        disabled={processing}
                    />
                </FormField>

                <FormField
                    id="pay-notes"
                    label={t('payments:form.fields.notes')}
                    error={errors.notes}
                >
                    <Textarea
                        id="pay-notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={2}
                        disabled={processing}
                    />
                </FormField>
            </FormSection>
        </FormModal>
    );
}
