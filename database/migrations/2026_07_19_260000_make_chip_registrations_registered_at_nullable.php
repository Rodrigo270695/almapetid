<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * pending_payment: el chip existe antes del pago, registered_at se llena al activar.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chip_registrations')) {
            return;
        }

        // Postgres: quitar NOT NULL (el default useCurrent solo aplica al INSERT sin columna).
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN registered_at DROP NOT NULL');
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN registered_at DROP DEFAULT');
    }

    public function down(): void
    {
        if (! Schema::hasTable('chip_registrations')) {
            return;
        }

        DB::statement("UPDATE chip_registrations SET registered_at = COALESCE(registered_at, created_at, NOW()) WHERE registered_at IS NULL");
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN registered_at SET NOT NULL');
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN registered_at SET DEFAULT CURRENT_TIMESTAMP');
    }
};
