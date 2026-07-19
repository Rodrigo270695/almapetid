import { Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LOCALE_STORAGE_KEY,
    SUPPORTED_LOCALES
    
} from '@/lib/i18n';
import type {SupportedLocale} from '@/lib/i18n';

const LOCALE_LABELS: Record<SupportedLocale, { native: string; flag: string }> =
    {
        es: { native: 'Español', flag: '🇪🇸' },
        en: { native: 'English', flag: '🇬🇧' },
    };

export type LanguageSwitcherProps = {
    size?: 'sm' | 'icon';
    compact?: boolean;
    /** Para fondos oscuros (navbar marketing). */
    onDark?: boolean;
};

export function LanguageSwitcher({
    size = 'sm',
    compact = false,
    onDark = false,
}: LanguageSwitcherProps) {
    const { i18n, t } = useTranslation('common');
    const current = (i18n.language?.split('-')[0] ?? 'es') as SupportedLocale;
    const currentLabel = LOCALE_LABELS[current] ?? LOCALE_LABELS.es;

    const handleSelect = (locale: SupportedLocale) => {
        void i18n.changeLanguage(locale);

        try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch {
            // ignore
        }

        document.cookie = `almapetid_locale=${encodeURIComponent(locale)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size={compact ? 'icon' : size}
                    aria-label={t('language.label')}
                    className={
                        onDark
                            ? 'cursor-pointer gap-2 text-white hover:bg-white/10 hover:text-white'
                            : 'cursor-pointer gap-2'
                    }
                >
                    <Globe className="size-4" strokeWidth={2.25} />
                    {!compact && (
                        <span className="text-xs font-medium tabular-nums">
                            {currentLabel.flag}{' '}
                            <span className="uppercase">{current}</span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">
                    {t('language.label')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUPPORTED_LOCALES.map((locale) => {
                    const label = LOCALE_LABELS[locale];
                    const isActive = locale === current;

                    return (
                        <DropdownMenuItem
                            key={locale}
                            onSelect={() => handleSelect(locale)}
                            className="cursor-pointer justify-between gap-2"
                        >
                            <span className="flex items-center gap-2">
                                <span aria-hidden>{label.flag}</span>
                                <span>{label.native}</span>
                            </span>
                            {isActive && (
                                <Check
                                    className="size-4 text-primary"
                                    strokeWidth={2.5}
                                    aria-hidden
                                />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
