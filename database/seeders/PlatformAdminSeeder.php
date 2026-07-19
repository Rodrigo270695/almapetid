<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Auth\Roles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ALMAPET_PLATFORM_ADMIN_EMAIL', 'admin@almapetid.test');
        $name = (string) env('ALMAPET_PLATFORM_ADMIN_NAME', 'Platform');
        $lastname = (string) env('ALMAPET_PLATFORM_ADMIN_LASTNAME', 'Admin');
        $password = (string) env('ALMAPET_PLATFORM_ADMIN_PASSWORD', 'password');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'lastname' => $lastname,
                'document_type' => 'dni',
                'document_number' => '90000001',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ],
        );

        if (! $user->hasRole(Roles::PLATFORM_ADMIN)) {
            $user->syncRoles([Roles::PLATFORM_ADMIN]);
        }
    }
}
