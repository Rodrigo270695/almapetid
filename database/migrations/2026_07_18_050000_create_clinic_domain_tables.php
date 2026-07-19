<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32)->default('clinic');
            $table->string('ruc', 11)->unique();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->char('country_code', 2)->default('PE');
            $table->foreignId('distrito_id')
                ->nullable()
                ->constrained('distritos')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('departamento', 120)->nullable();
            $table->string('provincia', 120)->nullable();
            $table->string('distrito', 120)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 40)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('distrito_id');
        });

        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 32)->default('org_admin');
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
        });

        Schema::create('owners', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 32);
            $table->string('document_number', 64);
            $table->string('name');
            $table->string('lastname');
            $table->string('email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->foreignId('distrito_id')
                ->nullable()
                ->constrained('distritos')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('departamento', 120)->nullable();
            $table->string('provincia', 120)->nullable();
            $table->string('distrito', 120)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['document_type', 'document_number']);
            $table->index('user_id');
            $table->index('distrito_id');
        });

        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('owners')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('species', 40);
            $table->string('breed', 80)->nullable();
            $table->string('sex', 20)->nullable();
            $table->string('color', 80)->nullable();
            $table->date('birth_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('chip_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('microchip', 20)->unique();
            $table->string('public_code', 16)->unique();
            $table->foreignId('animal_id')->constrained('animals')->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained('organizations')->restrictOnDelete();
            $table->foreignId('registered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 32)->default('active');
            $table->timestamp('registered_at')->useCurrent();
            $table->date('implant_date')->nullable();
            $table->string('implant_site', 80)->nullable();
            $table->string('certificate_code', 40)->nullable()->unique();
            $table->char('country_code', 2)->default('PE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chip_registrations');
        Schema::dropIfExists('animals');
        Schema::dropIfExists('owners');
        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
    }
};
