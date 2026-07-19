import { useTranslation } from 'react-i18next';
import { LegalDocument } from '@/components/public/legal/legal-document';
import PublicLayout from '@/layouts/public-layout';

export default function LegalPrivacy() {
    const { t } = useTranslation('legal');

    return (
        <PublicLayout title={t('privacy.title')}>
            <LegalDocument doc="privacy" />
        </PublicLayout>
    );
}
