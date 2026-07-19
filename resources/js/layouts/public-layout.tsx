import PublicSiteLayout from '@/layouts/public/public-site-layout';

export default function PublicLayout({
    children,
    title,
    flushTop,
}: {
    children: React.ReactNode;
    title?: string;
    flushTop?: boolean;
}) {
    return (
        <PublicSiteLayout title={title} flushTop={flushTop}>
            {children}
        </PublicSiteLayout>
    );
}
