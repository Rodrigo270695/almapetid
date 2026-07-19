import { LoaderCircle, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFieldClassName } from '@/lib/auth-field-styles';
import { cn } from '@/lib/utils';

type OrgValues = {
    ruc: string;
    organization_name: string;
    address: string;
};

type Props = {
    values: OrgValues;
    onChange: (next: Partial<OrgValues>) => void;
    lookupUrl: string;
    errors?: Partial<Record<keyof OrgValues, string>>;
    tabIndexStart?: number;
};

function onlyDigits(value: string, max: number): string {
    return value.replace(/\D+/g, '').slice(0, max);
}

export default function OrganizationRucFields({
    values,
    onChange,
    lookupUrl,
    errors = {},
    tabIndexStart = 1,
}: Props) {
    const { t } = useTranslation('auth');
    const [consultando, setConsultando] = useState(false);
    const [lockedFromLookup, setLockedFromLookup] = useState(false);
    const lastLookedUp = useRef<string | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const canLookup = values.ruc.length === 11;
    const counterLabel = `${values.ruc.length}/11`;

    const consultarRuc = async (ruc: string) => {
        if (ruc.length !== 11 || consultando) {
            return;
        }

        if (lastLookedUp.current === ruc) {
            return;
        }

        setConsultando(true);
        lastLookedUp.current = ruc;

        try {
            const url = `${lookupUrl}?ruc=${encodeURIComponent(ruc)}`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const json = (await res.json()) as {
                success?: boolean;
                message?: string;
                data?: { name?: string; address?: string | null };
            };

            if (!res.ok || !json.success || !json.data) {
                lastLookedUp.current = null;
                toast.error(json.message || t('clinic.lookup_error'));
                return;
            }

            onChangeRef.current({
                organization_name: json.data.name ?? '',
                address: json.data.address ?? '',
            });
            setLockedFromLookup(true);
            toast.success(t('clinic.lookup_success'));
        } catch {
            lastLookedUp.current = null;
            toast.error(t('clinic.lookup_error'));
        } finally {
            setConsultando(false);
        }
    };

    useEffect(() => {
        if (values.ruc.length === 11) {
            void consultarRuc(values.ruc);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al completar 11 dígitos
    }, [values.ruc]);

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="ruc">{t('clinic.ruc')}</Label>
                <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Input
                            id="ruc"
                            name="ruc"
                            inputMode="numeric"
                            autoComplete="off"
                            required
                            tabIndex={tabIndexStart}
                            value={values.ruc}
                            placeholder={t('clinic.ruc_placeholder')}
                            className={cn(authFieldClassName, 'pr-14')}
                            onChange={(e) => {
                                const ruc = onlyDigits(e.target.value, 11);
                                setLockedFromLookup(false);
                                lastLookedUp.current = null;
                                onChange({
                                    ruc,
                                    organization_name: '',
                                    address: '',
                                });
                            }}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                            {counterLabel}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0 rounded-2xl"
                        tabIndex={tabIndexStart + 1}
                        disabled={!canLookup || consultando}
                        aria-label={t('clinic.lookup_aria')}
                        onClick={() => void consultarRuc(values.ruc)}
                    >
                        {consultando ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <Search className="size-4" />
                        )}
                    </Button>
                </div>
                <InputError message={errors.ruc} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="organization_name">
                    {t('clinic.organization_name')}
                </Label>
                <Input
                    id="organization_name"
                    name="organization_name"
                    required
                    tabIndex={tabIndexStart + 2}
                    value={values.organization_name}
                    readOnly={lockedFromLookup}
                    placeholder={t('clinic.organization_name_placeholder')}
                    className={cn(
                        authFieldClassName,
                        lockedFromLookup && 'bg-muted/40',
                    )}
                    onChange={(e) =>
                        onChange({ organization_name: e.target.value })
                    }
                />
                <InputError message={errors.organization_name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">{t('clinic.address')}</Label>
                <Input
                    id="address"
                    name="address"
                    tabIndex={tabIndexStart + 3}
                    value={values.address}
                    placeholder={t('clinic.address_placeholder')}
                    className={authFieldClassName}
                    onChange={(e) => onChange({ address: e.target.value })}
                />
                <InputError message={errors.address} />
            </div>
        </div>
    );
}
