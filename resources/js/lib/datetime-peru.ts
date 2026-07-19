/** Zona horaria oficial de la app (Perú, sin DST). */
export const APP_TIMEZONE = 'America/Lima';

/**
 * Formatea un instante ISO en fecha/hora de Perú (es-PE, 24h, sin segundos).
 */
export function formatDateTimePeru(
    value: string | null | undefined,
): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat('es-PE', {
        timeZone: APP_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

/**
 * Valor actual para `<input type="datetime-local">` en zona Perú.
 */
export function nowDatetimeLocalPeru(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? '00';

    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Interpreta un valor `datetime-local` (sin zona) como hora de pared en Perú
 * y lo serializa a ISO-8601 con offset, para que el backend no lo tome como UTC.
 *
 * Ejemplo: `2026-07-19T12:37` → `2026-07-19T12:37:00-05:00`
 */
export function datetimeLocalPeruToIso(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(
        value.trim(),
    );
    if (!match) {
        return value;
    }

    const [, y, mo, d, h, mi, sec] = match;
    const s = sec ?? '00';

    return `${y}-${mo}-${d}T${h}:${mi}:${s}-05:00`;
}
