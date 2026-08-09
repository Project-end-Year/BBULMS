<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('direct'); // direct, group, course
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['type', 'is_active']);
            $table->index('course_offering_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
