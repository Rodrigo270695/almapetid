<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name', 120);
            $table->string('description', 255)->nullable();
            // registration = fee único por alta; annual = vigencia anual
            $table->string('billing_period', 32)->default('registration');
            $table->unsignedSmallInteger('duration_months')->nullable();
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->boolean('active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('registration_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->foreignId('chip_registration_id')->nullable()->constrained('chip_registrations')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->string('status', 32)->default('pending'); // pending|paid|failed|refunded
            $table->string('provider', 32)->default('manual'); // manual|culqi|niubiz|stripe
            $table->string('provider_reference', 120)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('provider');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_payments');
        Schema::dropIfExists('plans');
    }
};
