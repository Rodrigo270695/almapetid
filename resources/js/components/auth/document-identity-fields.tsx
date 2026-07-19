import { LoaderCircle, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { authFieldClassName } from '@/lib/auth-field-styles';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPES, type DocumentType } from '@/types';

type DocumentIdentityValues = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

type Props = {
    values: DocumentIdentityValues;
    onChange: (next: Partial<DocumentIdentityValues>) => void;
    lookupUrl: string;
    errors?: Partial<Record<keyof DocumentIdentityValues, string>>;
    nameReadOnlyAfterLookup?: boolean;
    tabIndexStart?: number;
    /** Prefijo para names anidados, p.ej. "owner" → owner[document_type] */
    namePrefix?: string;
};

function onlyDigits(value: string, max: number): string {
    return value.replace(/\D+/g, '').slice(0, max);
}

export default function DocumentIdentityFields({
    values,
    onChange,
    lookupUrl,
    errors = {},
    nameReadOnlyAfterLookup = true,
    tabIndexStart = 1,
    namePrefix,
}: Props) {
    const { t } = useTranslation('auth');
    const [consultando, setConsultando] = useState(false);
    const [lockedFromLookup, setLockedFromLookup] = useState(false);
    const lastLookedUp = useRef<string | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const fieldName = (key: string) =>
        namePrefix ? `${namePrefix}[${key}]` : key;

    const isDni = values.document_type === 'dni';
    const docMax = isDni ? 8 : 64;
    const canLookup = isDni && values.document_number.length === 8;

    const counterLabel = useMemo(() => {
        if (!isDni) {
            return null;
        }

        return `${values.document_number.length}/8`;
    }, [isDni, values.document_number.length]);

    const consultarDni = async (dni: string) => {
        if (dni.length !== 8 || consultando) {
            return;
        }

        if (lastLookedUp.current === dni) {
            return;
        }

        setConsultando(true);
        lastLookedUp.current = dni;

        try {
            const url = `${lookupUrl}?dni=${encodeURIComponent(dni)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const body = (await res.json()) as {
                success?: boolean;
                message?: string;
                code?: string;
                data?: {
                    dni?: string;
                    name?: string;
                    lastname?: string;
                };
            };

            if (!res.ok || !body.success || !body.data) {
                lastLookedUp.current = null;
                toast.error(
                    res.status === 429 || body.code === 'rate_limit'
                        ? t('document.lookup_rate_limit')
                        : (body.message ?? t('document.lookup_error')),
                );

                return;
            }

            onChangeRef.current({
                document_number: body.data.dni ?? dni,
                name: body.data.name ?? '',
                lastname: body.data.lastname ?? '',
            });
            setLockedFromLookup(nameReadOnlyAfterLookup);
            toast.success(t('document.lookup_success'));
        } catch {
            lastLookedUp.current = null;
            toast.error(t('document.lookup_error'));
        } finally {
            setConsultando(false);
        }
    };

    useEffect(() => {
        if (!isDni || values.document_number.length !== 8) {
            return;
        }

        void consultarDni(values.document_number);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al completar 8 dígitos
    }, [isDni, values.document_number]);

    const onTipoChange = (type: DocumentType) => {
        setLockedFromLookup(false);
        lastLookedUp.current = null;
        const numero =
            type === 'dni'
                ? onlyDigits(values.document_number, 8)
                : values.document_number;

        onChange({
            document_type: type,
            document_number: numero,
        });
    };

    const onNumeroChange = (raw: string) => {
        setLockedFromLookup(false);
        const next = isDni ? onlyDigits(raw, 8) : raw.slice(0, 64);
        if (next !== values.document_number) {
            lastLookedUp.current = null;
        }
        onChange({ document_number: next });
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="document_type">
                        {t('common.document_type')}
                    </Label>
                    <input
                        type="hidden"
                        name={fieldName('document_type')}
                        value={values.document_type}
                    />
                    <Select
                        value={values.document_type}
                        onValueChange={(v) => onTipoChange(v as DocumentType)}
                    >
                        <SelectTrigger
                            id="document_type"
                            tabIndex={tabIndexStart}
                            className={cn(
                                authFieldClassName,
                                'h-11! min-h-11 w-full rounded-2xl px-3 data-[size=default]:h-11!',
                            )}
                        >
                            <SelectValue
                                placeholder={t(
                                    'common.document_type_placeholder',
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {DOCUMENT_TYPES.map((type) => (
                                <SelectItem
                                    key={type}
                                    value={type}
                                    className="rounded-lg"
                                >
                                    {t(`common.document_types.${type}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.document_type} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="document_number">
                        {t('common.document_number')}
                    </Label>
                    <div className="flex items-stretch gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Input
                                id="document_number"
                                name={fieldName('document_number')}
                                value={values.document_number}
                                onChange={(e) => onNumeroChange(e.target.value)}
                                required
                                tabIndex={tabIndexStart + 1}
                                inputMode={isDni ? 'numeric' : 'text'}
                                autoComplete="off"
                                maxLength={docMax}
                                placeholder={
                                    isDni
                                        ? t(
                                              'common.document_number_dni_placeholder',
                                          )
                                        : t(
                                              'common.document_number_placeholder',
                                          )
                                }
                                className={cn(
                                    authFieldClassName,
                                    isDni && 'pr-12',
                                )}
                            />
                            {counterLabel ? (
                                <span
                                    className={cn(
                                        'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs tabular-nums',
                                        values.document_number.length === 8
                                            ? 'font-medium text-brand-sky'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {counterLabel}
                                </span>
                            ) : null}
                        </div>
                        {isDni ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                tabIndex={tabIndexStart + 2}
                                disabled={!canLookup || consultando}
                                onClick={() => {
                                    lastLookedUp.current = null;
                                    void consultarDni(values.document_number);
                                }}
                                className="size-11 shrink-0 rounded-2xl border-border/70 bg-background/50 text-brand-sky shadow-sm hover:bg-brand-sky/10 hover:text-brand-sky"
                                aria-label={t('document.lookup_aria')}
                            >
                                {consultando ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                    <Search className="size-4" />
                                )}
                            </Button>
                        ) : null}
                    </div>
                    <InputError message={errors.document_number} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('common.name')}</Label>
                    <Input
                        id="name"
                        name={fieldName('name')}
                        value={values.name}
                        onChange={(e) => {
                            setLockedFromLookup(false);
                            onChange({ name: e.target.value });
                        }}
                        required
                        tabIndex={tabIndexStart + 3}
                        autoComplete="given-name"
                        readOnly={lockedFromLookup}
                        placeholder={t('common.name_placeholder')}
                        className={cn(
                            authFieldClassName,
                            lockedFromLookup && 'bg-muted/40',
                        )}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="lastname">{t('common.lastname')}</Label>
                    <Input
                        id="lastname"
                        name={fieldName('lastname')}
                        value={values.lastname}
                        onChange={(e) => {
                            setLockedFromLookup(false);
                            onChange({ lastname: e.target.value });
                        }}
                        required
                        tabIndex={tabIndexStart + 4}
                        autoComplete="family-name"
                        readOnly={lockedFromLookup}
                        placeholder={t('common.lastname_placeholder')}
                        className={cn(
                            authFieldClassName,
                            lockedFromLookup && 'bg-muted/40',
                        )}
                    />
                    <InputError message={errors.lastname} />
                </div>
            </div>
        </div>
    );
}
