<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_offering_id')->constrained('course_offerings')->onDelete('cascade');
            $table->foreignId('lecturer_id')->constrained('users')->onDelete('cascade');
            $table->string('title')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->string('code', 32)->unique();
            $table->string('qr_token', 64)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('late_threshold_minutes')->default(15);
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index('course_offering_id');
            $table->index('code');
            $table->index('qr_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
