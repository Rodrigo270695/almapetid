export type AuthNavDirection =
    | 'to-register'
    | 'to-login'
    | 'to-forgot'
    | 'from-forgot';

const AUTH_NAV_ATTR = 'data-auth-nav';

/** Marca la dirección antes de la View Transition (CSS la lee). */
export function prepareAuthNav(direction: AuthNavDirection): void {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.setAttribute(AUTH_NAV_ATTR, direction);
}

export function clearAuthNav(): void {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.removeAttribute(AUTH_NAV_ATTR);
}

export function authViewTransition() {
    return (transition: ViewTransition) => {
        void transition.finished.finally(() => {
            clearAuthNav();
        });
    };
}
