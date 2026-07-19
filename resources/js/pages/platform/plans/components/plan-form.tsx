import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import plans from '@/routes/platform/plans';
import type { Plan } from '../types';

type PlanFormData = {
    code: string;
    name: string;
    description: string;
    billing_period: 'registration' | 'annual';
    duration_months: string;
    amount: string;
    vetsaas_amount: string;
    vetsaas_clinic_commission: string;
    partner_amount: string;
    partner_clinic_commission: string;
    currency: 'PEN' | 'USD';
    active: boolean;
    is_default: boolean;
};

const emptyForm: PlanFormData = {
    code: '',
    name: '',
    description: '',
    billing_period: 'registration',
    duration_months: '12',
    amount: '',
    vetsaas_amount: '',
    vetsaas_clinic_commission: '',
    partner_amount: '',
    partner_clinic_commission: '',
    currency: 'PEN',
    active: true,
    is_default: false,
};

const moneyOrEmpty = (value: string | null | undefined): string =>
    value != null && value !== '' ? String(value) : '';

const buildInitial = (plan: Plan | null): PlanFormData =>
    plan
        ? {
              code: plan.code,
              name: plan.name,
              description: plan.description ?? '',
              billing_period: plan.billing_period,
              duration_months:
                  plan.duration_months != null
                      ? String(plan.duration_months)
                      : '12',
              amount: String(plan.amount),
              vetsaas_amount: moneyOrEmpty(plan.vetsaas_amount),
              vetsaas_clinic_commission: moneyOrEmpty(
                  plan.vetsaas_clinic_commission,
              ),
              partner_amount: moneyOrEmpty(plan.partner_amount),
              partner_clinic_commission: moneyOrEmpty(
                  plan.partner_clinic_commission,
              ),
              currency: plan.currency,
              active: plan.active,
              is_default: plan.is_default,
          }
        : emptyForm;

function optionalMoney(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === '') {
        return null;
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}

export type PlanFormProps = {
    plan?: Plan | null;
};

export function PlanForm({ plan = null }: PlanFormProps) {
    const { t } = useTranslation(['plans', 'common']);
    const isEdit = plan !== null;
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        transform,
    } = useForm<PlanFormData>(buildInitial(plan));

    const vetsaasPlatform = useMemo(() => {
        const price = Number(data.vetsaas_amount || data.amount || 0);
        const clinic = Number(data.vetsaas_clinic_commission || 0);
        if (!Number.isFinite(price)) return null;
        return Math.max(0, price - (Number.isFinite(clinic) ? clinic : 0));
    }, [data.amount, data.vetsaas_amount, data.vetsaas_clinic_commission]);

    const partnerPlatform = useMemo(() => {
        const price = Number(data.partner_amount || data.amount || 0);
        const clinic = Number(data.partner_clinic_commission || 0);
        if (!Number.isFinite(price)) return null;
        return Math.max(0, price - (Number.isFinite(clinic) ? clinic : 0));
    }, [data.amount, data.partner_amount, data.partner_clinic_commission]);

    const canSubmit = useMemo(() => {
        if (data.code.trim().length < 2) return false;
        if (data.name.trim().length < 2) return false;
        const amount = Number(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) return false;
        if (data.billing_period === 'annual') {
            const months = Number(data.duration_months || 12);
            if (!Number.isFinite(months) || months < 1) return false;
        }
        return !processing;
    }, [data, processing]);

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        transform((form) => ({
            ...form,
            duration_months:
                form.billing_period === 'annual'
                    ? Number(form.duration_months || 12)
                    : null,
            amount: Number(form.amount),
            vetsaas_amount: optionalMoney(form.vetsaas_amount),
            vetsaas_clinic_commission: optionalMoney(
                form.vetsaas_clinic_commission,
            ),
            partner_amount: optionalMoney(form.partner_amount),
            partner_clinic_commission: optionalMoney(
                form.partner_clinic_commission,
            ),
        }));

        if (isEdit && plan) {
            put(plans.update(plan.id).url, { preserveScroll: true });
        } else {
            post(plans.store().url, { preserveScroll: true });
        }
    };

    return (
        <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
            <FormSection
                title={t('plans:form.section_basic')}
                description={t('plans:form.section_basic_hint')}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="plan-code"
                        label={t('plans:form.fields.code')}
                        error={errors.code}
                        required
                    >
                        <Input
                            id="plan-code"
                            value={data.code}
                            onChange={(e) =>
                                setData(
                                    'code',
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, '-'),
                                )
                            }
                            placeholder={t('plans:form.fields.code_placeholder')}
                            disabled={processing}
                        />
                    </FormField>
                    <FormField
                        id="plan-name"
                        label={t('plans:form.fields.name')}
                        error={errors.name}
                        required
                    >
                        <Input
                            id="plan-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('plans:form.fields.name_placeholder')}
                            disabled={processing}
                        />
                    </FormField>
                </div>

                <FormField
                    id="plan-description"
                    label={t('plans:form.fields.description')}
                    error={errors.description}
                >
                    <Textarea
                        id="plan-description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder={t(
                            'plans:form.fields.description_placeholder',
                        )}
                        disabled={processing}
                        rows={3}
                    />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="plan-period"
                        label={t('plans:form.fields.billing_period')}
                        error={errors.billing_period}
                        required
                    >
                        <Select
                            value={data.billing_period}
                            onValueChange={(v) =>
                                setData(
                                    'billing_period',
                                    v as PlanFormData['billing_period'],
                                )
                            }
                            disabled={processing}
                        >
                            <SelectTrigger id="plan-period" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="registration">
                                    {t('plans:periods.registration')}
                                </SelectItem>
                                <SelectItem value="annual">
                                    {t('plans:periods.annual')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    {data.billing_period === 'annual' ? (
                        <FormField
                            id="plan-months"
                            label={t('plans:form.fields.duration_months')}
                            error={errors.duration_months}
                            required
                        >
                            <Input
                                id="plan-months"
                                type="number"
                                min={1}
                                max={120}
                                value={data.duration_months}
                                onChange={(e) =>
                                    setData('duration_months', e.target.value)
                                }
                                disabled={processing}
                            />
                        </FormField>
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="plan-amount"
                        label={t('plans:form.fields.amount')}
                        hint={t('plans:form.fields.amount_hint')}
                        error={errors.amount}
                        required
                    >
                        <Input
                            id="plan-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            disabled={processing}
                        />
                    </FormField>
                    <FormField
                        id="plan-currency"
                        label={t('plans:form.fields.currency')}
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
                            <SelectTrigger id="plan-currency" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PEN">PEN</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={data.active}
                            onCheckedChange={(c) =>
                                setData('active', c === true)
                            }
                            disabled={processing}
                        />
                        {t('plans:form.fields.active')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={data.is_default}
                            onCheckedChange={(c) =>
                                setData('is_default', c === true)
                            }
                            disabled={processing}
                        />
                        {t('plans:form.fields.is_default')}
                    </label>
                </div>
            </FormSection>

            <FormSection
                title={t('plans:form.section_vetsaas')}
                description={t('plans:form.section_vetsaas_hint')}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="plan-vetsaas-amount"
                        label={t('plans:form.fields.vetsaas_amount')}
                        hint={t('plans:form.fields.vetsaas_amount_hint')}
                        error={errors.vetsaas_amount}
                    >
                        <Input
                            id="plan-vetsaas-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.vetsaas_amount}
                            onChange={(e) =>
                                setData('vetsaas_amount', e.target.value)
                            }
                            placeholder={data.amount || '—'}
                            disabled={processing}
                        />
                    </FormField>
                    <FormField
                        id="plan-vetsaas-clinic"
                        label={t('plans:form.fields.vetsaas_clinic_commission')}
                        hint={t(
                            'plans:form.fields.vetsaas_clinic_commission_hint',
                        )}
                        error={errors.vetsaas_clinic_commission}
                    >
                        <Input
                            id="plan-vetsaas-clinic"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.vetsaas_clinic_commission}
                            onChange={(e) =>
                                setData(
                                    'vetsaas_clinic_commission',
                                    e.target.value,
                                )
                            }
                            disabled={processing}
                        />
                    </FormField>
                </div>
                {vetsaasPlatform != null ? (
                    <p className="text-sm text-muted-foreground">
                        {t('plans:form.platform_share', {
                            amount: vetsaasPlatform.toFixed(2),
                            currency: data.currency,
                        })}
                    </p>
                ) : null}
            </FormSection>

            <FormSection
                title={t('plans:form.section_partner')}
                description={t('plans:form.section_partner_hint')}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="plan-partner-amount"
                        label={t('plans:form.fields.partner_amount')}
                        hint={t('plans:form.fields.partner_amount_hint')}
                        error={errors.partner_amount}
                    >
                        <Input
                            id="plan-partner-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.partner_amount}
                            onChange={(e) =>
                                setData('partner_amount', e.target.value)
                            }
                            placeholder={data.amount || '—'}
                            disabled={processing}
                        />
                    </FormField>
                    <FormField
                        id="plan-partner-clinic"
                        label={t('plans:form.fields.partner_clinic_commission')}
                        hint={t(
                            'plans:form.fields.partner_clinic_commission_hint',
                        )}
                        error={errors.partner_clinic_commission}
                    >
                        <Input
                            id="plan-partner-clinic"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.partner_clinic_commission}
                            onChange={(e) =>
                                setData(
                                    'partner_clinic_commission',
                                    e.target.value,
                                )
                            }
                            disabled={processing}
                        />
                    </FormField>
                </div>
                {partnerPlatform != null ? (
                    <p className="text-sm text-muted-foreground">
                        {t('plans:form.platform_share', {
                            amount: partnerPlatform.toFixed(2),
                            currency: data.currency,
                        })}
                    </p>
                ) : null}
            </FormSection>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="cursor-pointer"
                >
                    <Link href={plans.index()}>{t('common:actions.cancel')}</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    {isEdit
                        ? t('plans:form.submit_edit')
                        : t('plans:form.submit_create')}
                </Button>
            </div>
        </form>
    );
}
