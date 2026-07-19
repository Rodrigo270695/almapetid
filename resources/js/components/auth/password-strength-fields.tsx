import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { authFieldClassName } from '@/lib/auth-field-styles';
import {
    evaluatePassword,
    isPasswordStrong,
    passwordScore,
    passwordsMatch,
} from '@/lib/password-strength';
import { cn } from '@/lib/utils';

type Props = {
    password: string;
    confirmation: string;
    onPasswordChange: (value: string) => void;
    onConfirmationChange: (value: string) => void;
    passwordError?: string;
    confirmationError?: string;
    passwordRulesAttr?: string;
    tabIndexStart?: number;
    showHints?: boolean;
};

const SCORE_TONES = [
    'bg-muted',
    'bg-destructive/80',
    'bg-orange-500',
    'bg-amber-500',
    'bg-brand-sky',
    'bg-emerald-500',
] as const;

export default function PasswordStrengthFields({
    password,
    confirmation,
    onPasswordChange,
    onConfirmationChange,
    passwordError,
    confirmationError,
    passwordRulesAttr,
    tabIndexStart = 1,
    showHints = true,
}: Props) {
    const { t } = useTranslation('auth');
    const rules = evaluatePassword(password);
    const score = passwordScore(password);
    const strong = isPasswordStrong(password);
    const match = passwordsMatch(password, confirmation);
    const showChecklist = showHints && password.length > 0;

    const strengthLabel =
        score === 0
            ? null
            : score <= 2
              ? t('password.strength_weak')
              : score <= 4
                ? t('password.strength_medium')
                : t('password.strength_strong');

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="password">{t('common.password')}</Label>
                <PasswordInput
                    id="password"
                    name="password"
                    required
                    tabIndex={tabIndexStart}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder={t('common.password')}
                    passwordrules={passwordRulesAttr}
                    className={authFieldClassName}
                    aria-invalid={Boolean(passwordError) || (password.length > 0 && !strong)}
                />
                <InputError message={passwordError} />

                {showChecklist ? (
                    <div className="space-y-2.5 rounded-2xl border border-border/60 bg-background/40 px-3.5 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-1 gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            'h-1.5 flex-1 rounded-full transition-colors duration-300',
                                            index < score
                                                ? SCORE_TONES[score]
                                                : 'bg-muted',
                                        )}
                                    />
                                ))}
                            </div>
                            {strengthLabel ? (
                                <span
                                    className={cn(
                                        'text-xs font-semibold tracking-wide',
                                        score <= 2 && 'text-destructive',
                                        score > 2 &&
                                            score <= 4 &&
                                            'text-amber-600 dark:text-amber-400',
                                        score === 5 &&
                                            'text-emerald-600 dark:text-emerald-400',
                                    )}
                                >
                                    {strengthLabel}
                                </span>
                            ) : null}
                        </div>

                        <ul className="grid gap-1.5 sm:grid-cols-2">
                            {rules.map((rule) => (
                                <li
                                    key={rule.key}
                                    className={cn(
                                        'flex items-center gap-2 text-xs transition-colors',
                                        rule.met
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {rule.met ? (
                                        <Check
                                            className="size-3.5 shrink-0"
                                            strokeWidth={2.5}
                                        />
                                    ) : (
                                        <Circle className="size-3.5 shrink-0 opacity-50" />
                                    )}
                                    <span>
                                        {t(`password.rules.${rule.key}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">
                    {t('common.password_confirm')}
                </Label>
                <PasswordInput
                    id="password_confirmation"
                    name="password_confirmation"
                    required
                    tabIndex={tabIndexStart + 1}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => onConfirmationChange(e.target.value)}
                    placeholder={t('common.password_confirm')}
                    passwordrules={passwordRulesAttr}
                    className={cn(
                        authFieldClassName,
                        confirmation.length > 0 &&
                            (match
                                ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30'
                                : 'border-destructive/40 focus-visible:ring-destructive/30'),
                    )}
                    aria-invalid={
                        Boolean(confirmationError) ||
                        (confirmation.length > 0 && !match)
                    }
                />
                <InputError message={confirmationError} />
                {confirmation.length > 0 ? (
                    <p
                        className={cn(
                            'text-xs font-medium',
                            match
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive',
                        )}
                    >
                        {match
                            ? t('password.match_ok')
                            : t('password.match_fail')}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
