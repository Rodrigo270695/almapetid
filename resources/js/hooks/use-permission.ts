import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Roles } from '@/lib/roles';
import type { Auth } from '@/types';

export type PermissionInput = string | string[];

export type UsePermissionReturn = {
    permissions: string[];
    roles: string[];
    /** Equivalente a platform_admin (bypass de permisos en UI). */
    isPlatformAdmin: boolean;
    can: (permission: PermissionInput) => boolean;
    canAll: (permissions: string[]) => boolean;
    hasRole: (role: string) => boolean;
};

/**
 * Hook central para chequear permisos en React.
 * Lee `auth.permissions` / `auth.roles` desde HandleInertiaRequests.
 */
export function usePermission(): UsePermissionReturn {
    const page = usePage<{ auth?: Auth }>();
    const auth = page.props.auth;

    const permissions = useMemo(
        () => auth?.permissions ?? [],
        [auth?.permissions],
    );
    const roles = useMemo(() => auth?.roles ?? [], [auth?.roles]);
    const permissionSet = useMemo(() => new Set(permissions), [permissions]);
    const isPlatformAdmin = roles.includes(Roles.PLATFORM_ADMIN);

    const can = (input: PermissionInput): boolean => {
        if (isPlatformAdmin) {
            return true;
        }

        const list = Array.isArray(input) ? input : [input];

        return list.some((p) => permissionSet.has(p));
    };

    const canAll = (list: string[]): boolean => {
        if (isPlatformAdmin) {
            return true;
        }

        return list.every((p) => permissionSet.has(p));
    };

    const hasRole = (role: string): boolean => roles.includes(role);

    return {
        permissions,
        roles,
        isPlatformAdmin,
        can,
        canAll,
        hasRole,
    };
}
