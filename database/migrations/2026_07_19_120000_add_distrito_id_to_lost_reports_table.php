<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ubigeo en reportes de pérdida (para DBs ya migradas sin recreate).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lost_reports')) {
            return;
        }

        Schema::table('lost_reports', function (Blueprint $table): void {
            if (! Schema::hasColumn('lost_reports', 'distrito_id')) {
                $table->foreignId('distrito_id')
                    ->nullable()
                    ->after('lost_at')
                    ->constrained('distritos')
                    ->nullOnDelete()
                    ->cascadeOnUpdate();
                $table->index('distrito_id');
            }

            if (! Schema::hasColumn('lost_reports', 'departamento')) {
                $table->string('departamento', 120)->nullable()->after('distrito_id');
            }
            if (! Schema::hasColumn('lost_reports', 'provincia')) {
                $table->string('provincia', 120)->nullable()->after('departamento');
            }
            if (! Schema::hasColumn('lost_reports', 'distrito')) {
                $table->string('distrito', 120)->nullable()->after('provincia');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('lost_reports')) {
            return;
        }

        Schema::table('lost_reports', function (Blueprint $table): void {
            if (Schema::hasColumn('lost_reports', 'distrito_id')) {
                $table->dropConstrainedForeignId('distrito_id');
            }
            foreach (['departamento', 'provincia', 'distrito'] as $col) {
                if (Schema::hasColumn('lost_reports', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
