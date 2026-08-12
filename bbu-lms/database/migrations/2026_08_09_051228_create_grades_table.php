<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_offering_id')->constrained('course_offerings')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('grade_component_id')->constrained('grade_components')->onDelete('cascade');
            $table->decimal('points', 8, 2)->nullable(); // earned points
            $table->decimal('max_points', 8, 2)->nullable(); // component max
            $table->decimal('percentage', 6, 2)->nullable(); // 0-100
            $table->string('letter_grade', 4)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['course_offering_id', 'student_id', 'grade_component_id']);
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
