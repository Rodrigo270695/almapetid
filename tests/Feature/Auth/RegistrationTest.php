<?php

use App\Enums\DocumentType;
use App\Support\Auth\Roles;
use Database\Seeders\PermissionsSeeder;
use Database\Seeders\RolesSeeder;
use Laravel\Fortify\Features;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
    $this->seed(PermissionsSeeder::class);
    $this->seed(RolesSeeder::class);
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Test',
        'lastname' => 'User',
        'document_type' => DocumentType::Dni->value,
        'document_number' => '12345678',
        'email' => 'test@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    $this->assertAuthenticated();
    $this->assertTrue(auth()->user()->hasRole(Roles::OWNER));
    $response->assertRedirect(route('dashboard', absolute: false));
});
