<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Auth\Roles;
use Illuminate\Database\Seeder;

class PlatformAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ALMAPET_PLATFORM_ADMIN_EMAIL', 'admin@almapetid.test');
        $name = (string) env('ALMAPET_PLATFORM_ADMIN_NAME', 'Platform');
        $lastname = (string) env('ALMAPET_PLATFORM_ADMIN_LASTNAME', 'Admin');
        // Plano: el cast `hashed` del User lo cifra una sola vez.
        $password = (string) env('ALMAPET_PLATFORM_ADMIN_PASSWORD', 'password');

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->fill([
            'name' => $name,
            'lastname' => $lastname,
            'document_type' => $user->document_type ?: 'dni',
            'document_number' => $user->document_number ?: '90000001',
            'password' => $password,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ]);
        $user->save();

        if (! $user->hasRole(Roles::PLATFORM_ADMIN)) {
            $user->syncRoles([Roles::PLATFORM_ADMIN]);
        }
    }
}
