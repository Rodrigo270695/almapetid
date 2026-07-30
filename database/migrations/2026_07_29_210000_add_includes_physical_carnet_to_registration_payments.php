<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registration_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('registration_payments', 'includes_physical_carnet')) {
                $table->boolean('includes_physical_carnet')->default(false)->after('clinic_commission');
            }
        });
    }

    public function down(): void
    {
        Schema::table('registration_payments', function (Blueprint $table): void {
            if (Schema::hasColumn('registration_payments', 'includes_physical_carnet')) {
                $table->dropColumn('includes_physical_carnet');
            }
        });
    }
};
