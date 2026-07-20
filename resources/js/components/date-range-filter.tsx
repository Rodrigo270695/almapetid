import { CalendarIcon, Check, X } from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    formatDay,
    formatMonthYear,
    isSameMonthYear,
    parseDay,
    rangeLast30Days,
    rangeLast7Days,
    rangeLastMonth,
    rangeThisMonth,
    rangeThisQuarter,
    rangeThisYear,
    toIsoDate,
} from '@/lib/date-range-presets';
import { cn } from '@/lib/utils';

export type DateRangeFilterProps = {
    desde: string | null;
    hasta: string | null;
    defaultDesde: string;
    defaultHasta: string;
    disabled?: boolean;
    onApply: (desde: string, hasta: string) => void;
    onClear?: () => void;
    triggerClassName?: string;
};

type PresetId =
    | 'this_month'
    | 'last_month'
    | 'last_7_days'
    | 'last_30_days'
    | 'this_quarter'
    | 'this_year'
    | 'custom';

type PresetOption = {
    id: PresetId;
    label: string;
    desde: string;
    hasta: string;
    from: Date;
    to: Date;
};

function formatPresetSpan(from: Date, to: Date, locale: string): string {
    return `${formatDay(from, locale)} — ${formatDay(to, locale)}`;
}

function formatTriggerLabel(
    from: Date | undefined,
    to: Date | undefined,
    locale: string,
    allDatesLabel: string,
): string {
    if (from == null || to == null) {
        return allDatesLabel;
    }

    if (isSameMonthYear(from, to)) {
        return formatMonthYear(from, locale);
    }

    return formatPresetSpan(from, to, locale);
}

function detectPresetId(
    desde: string | null,
    hasta: string | null,
    presets: PresetOption[],
): PresetId {
    if (!desde || !hasta) {
        return 'custom';
    }

    const match = presets.find((p) => p.desde === desde && p.hasta === hasta);

    return match?.id ?? 'custom';
}

export function DateRangeFilter({
    desde,
    hasta,
    defaultDesde,
    defaultHasta,
    disabled,
    onApply,
    onClear,
    triggerClassName,
}: DateRangeFilterProps) {
    const { t, i18n } = useTranslation(['common']);
    const locale = i18n.language;

    const [open, setOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [customDesde, setCustomDesde] = useState('');
    const [customHasta, setCustomHasta] = useState('');

    const presets = useMemo((): PresetOption[] => {
        const build = (
            id: PresetId,
            labelKey: string,
            range: { from: Date; to: Date },
        ): PresetOption => ({
            id,
            label: t(`common:date_range.${labelKey}`),
            from: range.from,
            to: range.to,
            desde: toIsoDate(range.from),
            hasta: toIsoDate(range.to),
        });

        const thisMonth = rangeThisMonth();
        const serverThisMonth =
            defaultDesde && defaultHasta
                ? {
                      from: parseDay(defaultDesde) ?? thisMonth.from,
                      to: parseDay(defaultHasta) ?? thisMonth.to,
                  }
                : thisMonth;

        return [
            build('this_month', 'preset_this_month', serverThisMonth),
            build('last_month', 'preset_last_month', rangeLastMonth()),
            build('last_7_days', 'preset_last_7_days', rangeLast7Days()),
            build('last_30_days', 'preset_last_30_days', rangeLast30Days()),
            build('this_quarter', 'preset_this_quarter', rangeThisQuarter()),
            build('this_year', 'preset_this_year', rangeThisYear()),
        ];
    }, [defaultDesde, defaultHasta, t]);

    const committedFrom = desde ? parseDay(desde) : undefined;
    const committedTo = hasta ? parseDay(hasta) : undefined;
    const hasRange = Boolean(desde && hasta);

    const activePresetId = useMemo(
        () => detectPresetId(desde, hasta, presets),
        [desde, hasta, presets],
    );

    const triggerLabel = hasRange
        ? formatTriggerLabel(
              committedFrom,
              committedTo,
              locale,
              t('common:date_range.all_dates'),
          )
        : t('common:date_range.all_dates');

    const applyRange = (fromIso: string, toIso: string) => {
        onApply(fromIso, toIso);
        setOpen(false);
    };

    const handleClear = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (onClear) {
            onClear();
        } else {
            onApply(defaultDesde, defaultHasta);
        }

        setOpen(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setCustomDesde(desde ?? defaultDesde);
            setCustomHasta(hasta ?? defaultHasta);
            setCustomOpen(activePresetId === 'custom');
        }

        setOpen(next);
    };

    useEffect(() => {
        if (open && activePresetId === 'custom') {
            setCustomOpen(true);
        }
    }, [open, activePresetId]);

    const applyCustom = () => {
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(customDesde) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(customHasta)
        ) {
            return;
        }

        const from = parseDay(customDesde);
        const to = parseDay(customHasta);

        if (!from || !to) {
            return;
        }

        applyRange(
            toIsoDate(from <= to ? from : to),
            toIsoDate(from <= to ? to : from),
        );
    };

    const canApplyCustom =
        /^\d{4}-\d{2}-\d{2}$/.test(customDesde) &&
        /^\d{4}-\d{2}-\d{2}$/.test(customHasta);

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-9 min-w-36 justify-start gap-2 rounded-lg px-2.5 font-normal shadow-xs transition-colors',
                        hasRange
                            ? 'border-brand-400 bg-card text-foreground hover:border-brand-500'
                            : 'text-muted-foreground',
                        triggerClassName,
                    )}
                    aria-label={t('common:date_range.aria')}
                >
                    <CalendarIcon
                        className={cn(
                            'size-3.5 shrink-0',
                            hasRange
                                ? 'text-brand-sky'
                                : 'opacity-60',
                        )}
                        aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        {triggerLabel}
                    </span>
                    {hasRange ? (
                        <span
                            role="button"
                            tabIndex={0}
                            className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={t('common:date_range.clear')}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleClear(e as unknown as MouseEvent);
                                }
                            }}
                        >
                            <X className="size-3.5" aria-hidden />
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(100vw-2rem,14.5rem)] overflow-hidden rounded-xl border border-border/70 p-0 shadow-lg"
                align="start"
                sideOffset={6}
            >
                <div className="flex flex-col p-1">
                    {presets.map((preset) => {
                        const isActive = activePresetId === preset.id;

                        return (
                            <button
                                key={preset.id}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                    applyRange(preset.desde, preset.hasta)
                                }
                                className={cn(
                                    'flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors',
                                    isActive
                                        ? 'border border-brand-400 bg-brand-sky-soft text-foreground'
                                        : 'border border-transparent hover:bg-muted/60',
                                )}
                            >
                                <span
                                    className={cn(
                                        'min-w-0 text-sm',
                                        isActive
                                            ? 'font-semibold'
                                            : 'font-medium text-foreground',
                                    )}
                                >
                                    {preset.label}
                                </span>
                                <span className="text-[0.65rem] leading-tight tabular-nums text-muted-foreground">
                                    {formatPresetSpan(
                                        preset.from,
                                        preset.to,
                                        locale,
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-border/60">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setCustomOpen((v) => !v)}
                        className={cn(
                            'flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors',
                            customOpen || activePresetId === 'custom'
                                ? 'bg-brand-sky-soft/80'
                                : 'hover:bg-muted/50',
                        )}
                    >
                        <span className="text-sm font-semibold text-foreground">
                            {t('common:date_range.custom')}
                        </span>
                        {customOpen || activePresetId === 'custom' ? (
                            <Check
                                className="size-3.5 text-brand-sky"
                                aria-hidden
                            />
                        ) : null}
                    </button>

                    {customOpen ? (
                        <div className="space-y-3 border-t border-border/40 bg-muted/15 px-3 py-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('common:date_range.from')}
                                    </span>
                                    <Input
                                        type="date"
                                        value={customDesde}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            setCustomDesde(e.target.value)
                                        }
                                        className="h-9 bg-card text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('common:date_range.to')}
                                    </span>
                                    <Input
                                        type="date"
                                        value={customHasta}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            setCustomHasta(e.target.value)
                                        }
                                        className="h-9 bg-card text-sm"
                                    />
                                </label>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                disabled={disabled || !canApplyCustom}
                                className="h-9 w-full cursor-pointer rounded-md font-medium"
                                onClick={applyCustom}
                            >
                                {t('common:date_range.apply')}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    );
}
