<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Auth\Roles;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            GeoSeeder::class,
            PermissionsSeeder::class,
            RolesSeeder::class,
            PlatformAdminSeeder::class,
            PlansSeeder::class,
            SpeciesBreedsSeeder::class,
            SponsorsSeeder::class,
        ]);

        $demo = User::query()->firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test',
                'lastname' => 'User',
                'document_type' => 'dni',
                'document_number' => '10000001',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        if (! $demo->hasRole(Roles::OWNER)) {
            $demo->assignRole(Roles::OWNER);
        }
    }
}
