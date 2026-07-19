import { useTranslation } from 'react-i18next';
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/whatsapp';

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden
        >
            <path d="M17.472 14.382c-.297-.139-1.633-.807-1.886-.9-.253-.093-.437-.139-.62.14-.184.278-.713.9-.874 1.085-.161.186-.322.209-.6.07-.277-.14-1.17-.431-2.23-1.374-.824-.735-1.381-1.64-1.542-1.918-.161-.278-.017-.428.122-.566.125-.124.278-.323.416-.485.139-.161.185-.278.278-.463.093-.185.047-.347-.023-.485-.07-.139-.62-1.497-.85-2.05-.224-.54-.451-.466-.62-.475l-.528-.01c-.185 0-.485.07-.74.347-.253.278-.967.944-.967 2.3 0 1.357.99 2.665 1.128 2.85.139.186 1.946 2.97 4.715 4.163.66.285 1.176.455 1.578.583.663.211 1.266.181 1.743.11.531-.08 1.633-.668 1.865-1.313.23-.645.23-1.197.161-1.313-.07-.116-.254-.185-.53-.323z" />
            <path d="M12.004 2.003a9.94 9.94 0 0 0-8.58 14.86L2 22l5.27-1.38A9.94 9.94 0 0 0 12.004 22C17.53 22 22 17.523 22 12.003S17.53 2.003 12.004 2.003zm0 18.14a8.2 8.2 0 0 1-4.18-1.14l-.3-.178-3.13.82.835-3.05-.196-.314a8.21 8.21 0 1 1 6.97 3.862z" />
        </svg>
    );
}

/** Flotante WhatsApp solo para clínicas / veterinarios. */
export function ClinicWhatsAppFloat() {
    const { t } = useTranslation('welcome');

    return (
        <a
            href={whatsappUrl(t('float.whatsapp_clinic_message'))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t('float.whatsapp_clinic')} ${WHATSAPP_DISPLAY}`}
            className="fixed right-4 bottom-20 z-[60] inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-3 text-white shadow-[0_16px_40px_-12px_rgba(37,211,102,0.7)] transition hover:scale-[1.03] hover:bg-[#1ebe57] md:right-6 md:bottom-24"
        >
            <WhatsAppIcon className="size-6" />
            <span className="pr-1 text-sm font-semibold">
                {t('float.whatsapp_clinic')}
            </span>
        </a>
    );
}
