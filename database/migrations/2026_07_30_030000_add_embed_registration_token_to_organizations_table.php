<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('embed_registration_token', 64)
                ->nullable()
                ->unique()
                ->after('vetsaas_slug');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropUnique(['embed_registration_token']);
            $table->dropColumn('embed_registration_token');
        });
    }
};
