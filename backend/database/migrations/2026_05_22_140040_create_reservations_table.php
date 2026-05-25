<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('status', [
                'draft',
                'pending',
                'approved',
                'rejected',
                'checked_out',
                'returned',
                'cancelled',
            ])->default('draft');
            $table->string('purpose');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['resource_id', 'status', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
