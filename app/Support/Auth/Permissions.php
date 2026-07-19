<?php

namespace App\Support\Auth;

/**
 * Catálogo grueso de permisos AlmaPet ID.
 * Formato: modulo.accion (igual que VetSaaS).
 */
final class Permissions
{
    /**
     * @var array<string, list<string>>
     */
    public const CATALOG = [
        'dashboard' => ['view'],
        'animals' => ['view', 'create', 'update'],
        'registrations' => ['view', 'create', 'activate', 'transfer', 'void'],
        'lost' => ['view', 'declare', 'recover'],
        'found' => ['view', 'manage'],
        'organizations' => ['view', 'update', 'manage-users'],
        'platform' => ['view', 'manage'],
        'search' => ['view'],
        'roles' => ['view', 'create', 'update', 'delete', 'bulk-delete'],
        'users' => ['view', 'create', 'update', 'delete', 'bulk-delete'],
        'plans' => ['view', 'create', 'update', 'delete'],
        'payments' => ['view', 'create', 'update'],
        'catalog' => ['view', 'manage', 'approve', 'suggest'],
        'alerts' => ['view', 'send'],
        'sponsors' => ['view', 'create', 'update', 'delete'],
    ];

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        $names = [];

        foreach (self::CATALOG as $module => $actions) {
            foreach ($actions as $action) {
                $names[] = "{$module}.{$action}";
            }
        }

        return $names;
    }
}
