/**
 * Roles canónicos AlmaPet ID (alineados con App\Support\Auth\Roles).
 */
export const Roles = {
    OWNER: 'owner',
    CLINIC_STAFF: 'clinic_staff',
    ORG_ADMIN: 'org_admin',
    PLATFORM_ADMIN: 'platform_admin',
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];
