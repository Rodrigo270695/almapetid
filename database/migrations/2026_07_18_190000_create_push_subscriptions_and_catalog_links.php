<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('endpoint', 500)->unique();
            $table->string('public_key')->nullable();
            $table->string('auth_token');
            $table->string('content_encoding', 32)->default('aesgcm');
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::table('catalog_suggestions', function (Blueprint $table) {
            $table->foreignId('created_species_id')
                ->nullable()
                ->after('species_id')
                ->constrained('species')
                ->nullOnDelete();
            $table->foreignId('created_breed_id')
                ->nullable()
                ->after('created_species_id')
                ->constrained('breeds')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('catalog_suggestions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_breed_id');
            $table->dropConstrainedForeignId('created_species_id');
        });

        Schema::dropIfExists('push_subscriptions');
    }
};
