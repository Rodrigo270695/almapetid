/** Solo dígitos; tope razonable para celular (+código país sin '+'). */
export const PHONE_MAX_DIGITS = 15;

export function sanitizePhoneDigits(
    value: string,
    max = PHONE_MAX_DIGITS,
): string {
    return value.replace(/\D+/g, '').slice(0, max);
}
