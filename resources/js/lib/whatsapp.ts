/** WhatsApp comercial AlmaPet ID (Perú). */
export const WHATSAPP_E164 = '51976709811';
export const WHATSAPP_DISPLAY = '+51 976 709 811';

export function whatsappUrl(message?: string): string {
    const base = `https://wa.me/${WHATSAPP_E164}`;
    if (!message) return base;
    return `${base}?text=${encodeURIComponent(message)}`;
}
