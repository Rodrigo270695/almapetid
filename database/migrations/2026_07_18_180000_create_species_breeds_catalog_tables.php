<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('species', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('breeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('species_id')->constrained('species')->cascadeOnDelete();
            $table->string('name', 120);
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['species_id', 'name']);
        });

        Schema::create('catalog_suggestions', function (Blueprint $table) {
            $table->id();
            $table->string('type', 16); // species|breed
            $table->string('name', 120);
            $table->foreignId('species_id')->nullable()->constrained('species')->nullOnDelete();
            $table->string('status', 16)->default('pending'); // pending|approved|rejected
            $table->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_notes', 255)->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
        });

        // Microchip: ampliar a 32 (ISO suele ser 15; evitamos truncado duro).
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN microchip TYPE VARCHAR(32)');
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_suggestions');
        Schema::dropIfExists('breeds');
        Schema::dropIfExists('species');
        DB::statement('ALTER TABLE chip_registrations ALTER COLUMN microchip TYPE VARCHAR(20)');
    }
};
