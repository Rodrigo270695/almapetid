export type PasswordRuleKey =
    | 'minLength'
    | 'lowercase'
    | 'uppercase'
    | 'number'
    | 'symbol';

export type PasswordRuleResult = {
    key: PasswordRuleKey;
    met: boolean;
};

const MIN_LENGTH = 8;

export function evaluatePassword(password: string): PasswordRuleResult[] {
    return [
        {
            key: 'minLength',
            met: password.length >= MIN_LENGTH,
        },
        {
            key: 'lowercase',
            met: /[a-záéíóúüñ]/.test(password),
        },
        {
            key: 'uppercase',
            met: /[A-ZÁÉÍÓÚÜÑ]/.test(password),
        },
        {
            key: 'number',
            met: /\d/.test(password),
        },
        {
            key: 'symbol',
            met: /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/.test(password),
        },
    ];
}

export function passwordScore(password: string): number {
    return evaluatePassword(password).filter((rule) => rule.met).length;
}

export function isPasswordStrong(password: string): boolean {
    return evaluatePassword(password).every((rule) => rule.met);
}

export function passwordsMatch(
    password: string,
    confirmation: string,
): boolean {
    return confirmation.length > 0 && password === confirmation;
}
