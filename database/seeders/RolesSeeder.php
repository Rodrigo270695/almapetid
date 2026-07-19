<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\Auth\Permissions;
use App\Support\Auth\Roles;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RolesSeeder extends Seeder
{
    /**
     * @var array<string, list<string>|'*'>
     */
    private const ROLE_PERMISSIONS = [
        Roles::OWNER => [
            'dashboard.view',
            'animals.view',
            'animals.create',
            'animals.update',
            'registrations.view',
            'lost.view',
            'lost.declare',
            'lost.recover',
            'found.view',
            'search.view',
            'catalog.view',
            'catalog.suggest',
        ],
        Roles::CLINIC_STAFF => [
            'dashboard.view',
            'animals.view',
            'animals.create',
            'animals.update',
            'registrations.view',
            'registrations.create',
            'registrations.activate',
            'lost.view',
            'lost.declare',
            'lost.recover',
            'found.view',
            'found.manage',
            'organizations.view',
            'search.view',
            'catalog.view',
            'catalog.suggest',
        ],
        Roles::ORG_ADMIN => [
            'dashboard.view',
            'animals.view',
            'animals.create',
            'animals.update',
            'registrations.view',
            'registrations.create',
            'registrations.activate',
            'registrations.transfer',
            'registrations.void',
            'lost.view',
            'lost.declare',
            'lost.recover',
            'found.view',
            'found.manage',
            'organizations.view',
            'organizations.update',
            'organizations.manage-users',
            'search.view',
            'catalog.view',
            'catalog.suggest',
        ],
        Roles::PLATFORM_ADMIN => '*',
    ];

    /**
     * @var array<string, string>
     */
    private const ROLE_DESCRIPTIONS = [
        Roles::OWNER => 'Dueño de mascota: consulta y gestiona sus animales registrados.',
        Roles::CLINIC_STAFF => 'Personal de clínica: registra chips y gestiona mascotas en la organización.',
        Roles::ORG_ADMIN => 'Administrador de clínica: gestiona usuarios y operaciones de la organización.',
        Roles::PLATFORM_ADMIN => 'Administrador de plataforma AlmaPet: acceso total al panel central.',
    ];

    public function run(): void
    {
        $guard = config('auth.defaults.guard', 'web');

        foreach (self::ROLE_PERMISSIONS as $roleName => $perms) {
            $role = Role::findOrCreate($roleName, $guard);
            $role->description = self::ROLE_DESCRIPTIONS[$roleName] ?? null;
            $role->save();

            if ($perms === '*') {
                $role->syncPermissions(Permissions::all());
            } else {
                $role->syncPermissions($perms);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
