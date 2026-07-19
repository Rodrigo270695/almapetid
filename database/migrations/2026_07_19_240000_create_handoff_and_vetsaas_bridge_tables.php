<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('handoff_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->json('payload');
            $table->timestampTz('expires_at');
            $table->timestampTz('used_at')->nullable();
            $table->string('vetsaas_tenant_id', 36)->nullable()->index();
            $table->string('vetsaas_paciente_id', 36)->nullable()->index();
            $table->timestampsTz();
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->uuid('vetsaas_tenant_id')->nullable()->after('show_on_network');
            $table->string('vetsaas_slug', 80)->nullable()->after('vetsaas_tenant_id');

            $table->unique('vetsaas_tenant_id');
            $table->index('vetsaas_slug');
        });

        Schema::table('chip_registrations', function (Blueprint $table) {
            $table->uuid('vetsaas_tenant_id')->nullable()->after('country_code');
            $table->uuid('vetsaas_paciente_id')->nullable()->after('vetsaas_tenant_id');

            $table->index('vetsaas_tenant_id');
            $table->index('vetsaas_paciente_id');
            $table->unique(['vetsaas_tenant_id', 'vetsaas_paciente_id'], 'chip_reg_vetsaas_paciente_unique');
        });
    }

    public function down(): void
    {
        Schema::table('chip_registrations', function (Blueprint $table) {
            $table->dropUnique('chip_reg_vetsaas_paciente_unique');
            $table->dropColumn(['vetsaas_tenant_id', 'vetsaas_paciente_id']);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropUnique(['vetsaas_tenant_id']);
            $table->dropColumn(['vetsaas_tenant_id', 'vetsaas_slug']);
        });

        Schema::dropIfExists('handoff_tokens');
    }
};
