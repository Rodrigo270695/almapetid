import { createInertiaApp } from '@inertiajs/react';
import PwaInstallBanner from '@/components/pwa-install-banner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import '@/lib/i18n';

const appName = import.meta.env.VITE_APP_NAME || 'AlmaPet ID';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('public/'):
            case name.startsWith('legal/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <PwaInstallBanner />
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#007598',
    },
});

initializeTheme();

void import('./pwa');
