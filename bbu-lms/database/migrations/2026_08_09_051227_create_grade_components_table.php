<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_offering_id')->constrained('course_offerings')->onDelete('cascade');
            $table->string('name');
            $table->string('type', 32); // assignment, attendance, midterm, final, custom
            $table->decimal('weight', 5, 2)->default(0); // percentage 0-100
            $table->unsignedInteger('order')->default(0);
            $table->json('settings')->nullable(); // e.g. drop lowest, count
            $table->timestamps();

            $table->index('course_offering_id');
            $table->unique(['course_offering_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_components');
    }
};
