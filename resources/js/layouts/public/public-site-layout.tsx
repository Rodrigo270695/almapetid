import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ScrollProgress } from '@/components/public/scroll-progress';
import { SiteFloatActions } from '@/components/public/site-float-actions';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteNavbar } from '@/components/public/site-navbar';

type PublicSiteLayoutProps = {
    children: ReactNode;
    title?: string;
    /** Hero a pantalla completa bajo el navbar. */
    flushTop?: boolean;
};

export default function PublicSiteLayout({
    children,
    title,
    flushTop = false,
}: PublicSiteLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            {title ? <Head title={title} /> : null}
            <ScrollProgress />
            <SiteNavbar variant={flushTop ? 'overlay' : 'solid'} />
            <main
                className={
                    flushTop
                        ? 'flex flex-1 flex-col'
                        : 'flex flex-1 flex-col pt-16 md:pt-[4.5rem]'
                }
            >
                {children}
            </main>
            <SiteFooter />
            <SiteFloatActions />
        </div>
    );
}
