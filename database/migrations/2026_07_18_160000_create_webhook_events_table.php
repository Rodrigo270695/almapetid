<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', 32);
            $table->string('gateway_event_id', 191);
            $table->string('event_type', 120)->nullable();
            $table->json('payload')->nullable();
            $table->boolean('processed')->default(false);
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->string('last_error', 1000)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'gateway_event_id']);
            $table->index(['gateway', 'processed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
