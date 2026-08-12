<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('course_id')->nullable()->constrained('courses')->onDelete('cascade');
            $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->onDelete('cascade');
            $table->string('source_type')->nullable()->index();
            $table->unsignedBigInteger('source_id')->nullable()->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('event'); // class, assignment, quiz, exam, event
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_all_day')->default(false);
            $table->string('color')->nullable();
            $table->timestamps();

            $table->index('start_at');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
