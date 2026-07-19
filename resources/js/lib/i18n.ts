import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import authEn from '@/lang/en/auth.json';
import commonEn from '@/lang/en/common.json';
import dashboardEn from '@/lang/en/dashboard.json';
import navEn from '@/lang/en/nav.json';
import settingsEn from '@/lang/en/settings.json';
import welcomeEn from '@/lang/en/welcome.json';
import rolesEn from '@/lang/en/roles.json';
import usuariosEn from '@/lang/en/usuarios.json';
import animalsEn from '@/lang/en/animals.json';
import catalogEn from '@/lang/en/catalog.json';
import plansEn from '@/lang/en/plans.json';
import paymentsEn from '@/lang/en/payments.json';
import pushEn from '@/lang/en/push.json';
import lostEn from '@/lang/en/lost.json';
import legalEn from '@/lang/en/legal.json';
import alertsEn from '@/lang/en/alerts.json';
import sponsorsEn from '@/lang/en/sponsors.json';
import authEs from '@/lang/es/auth.json';
import commonEs from '@/lang/es/common.json';
import dashboardEs from '@/lang/es/dashboard.json';
import navEs from '@/lang/es/nav.json';
import settingsEs from '@/lang/es/settings.json';
import welcomeEs from '@/lang/es/welcome.json';
import rolesEs from '@/lang/es/roles.json';
import usuariosEs from '@/lang/es/usuarios.json';
import animalsEs from '@/lang/es/animals.json';
import catalogEs from '@/lang/es/catalog.json';
import plansEs from '@/lang/es/plans.json';
import paymentsEs from '@/lang/es/payments.json';
import pushEs from '@/lang/es/push.json';
import lostEs from '@/lang/es/lost.json';
import legalEs from '@/lang/es/legal.json';
import alertsEs from '@/lang/es/alerts.json';
import sponsorsEs from '@/lang/es/sponsors.json';

/**
 * Idiomas disponibles. Mantén alineado con `resources/js/lang/<locale>/*.json`.
 */
export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'es';

/** Llave bajo la que se guarda el idioma elegido en localStorage. */
export const LOCALE_STORAGE_KEY = 'almapetid.locale';

const resources = {
    es: {
        common: commonEs,
        auth: authEs,
        nav: navEs,
        settings: settingsEs,
        dashboard: dashboardEs,
        welcome: welcomeEs,
        roles: rolesEs,
        usuarios: usuariosEs,
        animals: animalsEs,
        catalog: catalogEs,
        plans: plansEs,
        payments: paymentsEs,
        push: pushEs,
        lost: lostEs,
        legal: legalEs,
        alerts: alertsEs,
        sponsors: sponsorsEs,
    },
    en: {
        common: commonEn,
        auth: authEn,
        nav: navEn,
        settings: settingsEn,
        dashboard: dashboardEn,
        welcome: welcomeEn,
        roles: rolesEn,
        usuarios: usuariosEn,
        animals: animalsEn,
        catalog: catalogEn,
        plans: plansEn,
        payments: paymentsEn,
        push: pushEn,
        lost: lostEn,
        legal: legalEn,
        alerts: alertsEn,
        sponsors: sponsorsEn,
    },
} as const;

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: SUPPORTED_LOCALES as unknown as string[],
        defaultNS: 'common',
        ns: ['common', 'auth', 'nav', 'settings', 'dashboard', 'welcome', 'roles', 'usuarios', 'animals', 'catalog', 'plans', 'payments', 'push', 'lost', 'legal', 'alerts', 'sponsors'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: LOCALE_STORAGE_KEY,
            caches: ['localStorage'],
        },
        react: {
            useSuspense: false,
        },
    });

function syncHtmlLang(locale: string): void {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', locale);
    }
}

function syncLocaleCookie(locale: string): void {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `almapetid_locale=${encodeURIComponent(locale)};path=/;max-age=${maxAge};samesite=lax`;
}

syncHtmlLang(i18n.language || DEFAULT_LOCALE);
syncLocaleCookie((i18n.language || DEFAULT_LOCALE).split('-')[0] ?? DEFAULT_LOCALE);
i18n.on('languageChanged', (lng) => {
    const short = lng.split('-')[0] ?? DEFAULT_LOCALE;
    syncHtmlLang(short);
    syncLocaleCookie(short);
});

export default i18n;
