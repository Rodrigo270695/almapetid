<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Precio y comisión cuando el alta viene de VetSaaS (tenant)
            $table->decimal('vetsaas_amount', 10, 2)->nullable()->after('amount');
            $table->decimal('vetsaas_clinic_commission', 10, 2)->nullable()->after('vetsaas_amount');

            // Precio y comisión para clínicas partner (fuera de VetSaaS)
            $table->decimal('partner_amount', 10, 2)->nullable()->after('vetsaas_clinic_commission');
            $table->decimal('partner_clinic_commission', 10, 2)->nullable()->after('partner_amount');
        });

        Schema::table('registration_payments', function (Blueprint $table) {
            $table->string('channel', 32)->default('direct')->after('currency');
            $table->decimal('platform_amount', 10, 2)->nullable()->after('channel');
            $table->decimal('clinic_commission', 10, 2)->nullable()->after('platform_amount');
        });
    }

    public function down(): void
    {
        Schema::table('registration_payments', function (Blueprint $table) {
            $table->dropColumn(['channel', 'platform_amount', 'clinic_commission']);
        });

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'vetsaas_amount',
                'vetsaas_clinic_commission',
                'partner_amount',
                'partner_clinic_commission',
            ]);
        });
    }
};
