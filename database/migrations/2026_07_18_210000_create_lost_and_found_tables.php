<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lost_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('chip_registrations')->cascadeOnDelete();
            $table->string('status', 32)->default('open');
            $table->timestamp('lost_at');
            $table->foreignId('distrito_id')
                ->nullable()
                ->constrained('distritos')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->string('departamento', 120)->nullable();
            $table->string('provincia', 120)->nullable();
            $table->string('distrito', 120)->nullable();
            $table->string('last_seen_zone', 200)->nullable();
            $table->string('last_seen_city', 120)->nullable();
            $table->decimal('last_seen_lat', 10, 7)->nullable();
            $table->decimal('last_seen_lng', 10, 7)->nullable();
            $table->text('public_notes')->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('declared_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recovered_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_seen_city']);
            $table->index('registration_id');
            $table->index('distrito_id');
        });

        Schema::create('found_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('chip_registrations')->cascadeOnDelete();
            $table->foreignId('lost_report_id')->nullable()->constrained('lost_reports')->nullOnDelete();
            $table->string('reporter_name', 120);
            $table->string('reporter_phone', 40)->nullable();
            $table->string('reporter_email')->nullable();
            $table->text('message');
            $table->string('city', 120)->nullable();
            $table->string('zone', 200)->nullable();
            $table->timestamp('notified_owner_at')->nullable();
            $table->timestamps();

            $table->index('registration_id');
            $table->index('lost_report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('found_reports');
        Schema::dropIfExists('lost_reports');
    }
};
