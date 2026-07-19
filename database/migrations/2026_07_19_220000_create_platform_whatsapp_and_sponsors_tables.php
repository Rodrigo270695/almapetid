<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_whatsapp_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('openwa_session_id', 80);
            $table->string('openwa_session_name', 120)->unique();
            $table->string('status', 32)->default('created');
            $table->string('phone', 30)->nullable();
            $table->string('push_name', 120)->nullable();
            $table->timestampTz('connected_at')->nullable();
            $table->timestampTz('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestampsTz();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE platform_whatsapp_sessions ADD CONSTRAINT platform_whatsapp_sessions_status_chk CHECK (status IN ('created','initializing','qr_ready','authenticating','ready','disconnected','failed'))");
        }

        Schema::create('sponsors', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name', 120);
            $table->string('tagline', 200)->nullable();
            $table->string('url', 500)->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sponsors');
        Schema::dropIfExists('platform_whatsapp_sessions');
    }
};
