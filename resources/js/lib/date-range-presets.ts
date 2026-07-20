/** Helpers de rangos de fecha (zona America/Lima vía offset local del navegador + defaults del server). */

function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfQuarter(d: Date): Date {
    const q = Math.floor(d.getMonth() / 3) * 3;

    return new Date(d.getFullYear(), q, 1);
}

function endOfQuarter(d: Date): Date {
    const q = Math.floor(d.getMonth() / 3) * 3;

    return new Date(d.getFullYear(), q + 3, 0);
}

export function rangeThisMonth(): { from: Date; to: Date } {
    const n = new Date();

    return { from: startOfMonth(n), to: endOfMonth(n) };
}

export function rangeLastMonth(): { from: Date; to: Date } {
    const n = new Date();
    const ref = new Date(n.getFullYear(), n.getMonth() - 1, 1);

    return { from: startOfMonth(ref), to: endOfMonth(ref) };
}

export function rangeLast7Days(): { from: Date; to: Date } {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - 6);

    return { from, to };
}

export function rangeLast30Days(): { from: Date; to: Date } {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - 29);

    return { from, to };
}

export function rangeThisQuarter(): { from: Date; to: Date } {
    const n = new Date();

    return { from: startOfQuarter(n), to: endOfQuarter(n) };
}

export function rangeThisYear(): { from: Date; to: Date } {
    const n = new Date();

    return {
        from: new Date(n.getFullYear(), 0, 1),
        to: new Date(n.getFullYear(), 11, 31),
    };
}

export function toIsoDate(d: Date): string {
    return ymd(d);
}

export function parseDay(iso: string): Date | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return undefined;
    }

    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) {
        return undefined;
    }

    const dt = new Date(y, m - 1, d);

    return Number.isNaN(dt.getTime()) ? undefined : dt;
}

export function isSameMonthYear(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthYear(d: Date, locale: string): string {
    const raw = d.toLocaleDateString(locale.startsWith('en') ? 'en-US' : 'es-PE', {
        month: 'short',
        year: 'numeric',
    });

    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatDay(d: Date, locale: string): string {
    return d.toLocaleDateString(locale.startsWith('en') ? 'en-GB' : 'es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
