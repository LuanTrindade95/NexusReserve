<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_type_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('location');
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->enum('status', ['active', 'maintenance', 'retired'])->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['resource_type_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
