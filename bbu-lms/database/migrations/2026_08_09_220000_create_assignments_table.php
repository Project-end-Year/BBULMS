<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_offering_id')->constrained('course_offerings')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('instructions')->nullable();
            $table->dateTime('due_at');
            $table->decimal('max_points', 5, 2)->default(100.00);
            $table->unsignedInteger('allowed_attempts')->default(1);
            $table->json('allowed_file_types')->nullable();
            $table->unsignedInteger('max_file_size_mb')->default(10);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index('course_offering_id');
            $table->index('due_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
