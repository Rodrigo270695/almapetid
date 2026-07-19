<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $sm = Schema::getConnection()->getSchemaBuilder();
        $foreignKeys = $sm->getForeignKeys('chip_registrations');
        $hasOrgFk = collect($foreignKeys)->contains(
            fn (array $fk): bool => in_array('organization_id', $fk['columns'], true),
        );

        if ($hasOrgFk) {
            Schema::table('chip_registrations', function (Blueprint $table) {
                $table->dropForeign(['organization_id']);
            });
        }

        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN organization_id DROP NOT NULL');

        Schema::table('chip_registrations', function (Blueprint $table) {
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('chip_registrations', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
        });

        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN organization_id SET NOT NULL');

        Schema::table('chip_registrations', function (Blueprint $table) {
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->restrictOnDelete();
        });
    }
};
