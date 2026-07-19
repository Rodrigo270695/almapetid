<?php

namespace App\Support\Auth;

/**
 * Roles canónicos de AlmaPet ID (MVP).
 * Fuente de verdad: Spatie `roles`, no una columna enum en users.
 */
final class Roles
{
    public const OWNER = 'owner';

    public const CLINIC_STAFF = 'clinic_staff';

    public const ORG_ADMIN = 'org_admin';

    public const PLATFORM_ADMIN = 'platform_admin';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::OWNER,
            self::CLINIC_STAFF,
            self::ORG_ADMIN,
            self::PLATFORM_ADMIN,
        ];
    }
}
