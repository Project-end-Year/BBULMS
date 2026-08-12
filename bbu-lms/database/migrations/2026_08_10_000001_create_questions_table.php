<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->string('type'); // multiple_choice, true_false, short_answer
            $table->text('prompt');
            $table->decimal('points', 8, 2)->default(1);
            $table->integer('order')->default(0);
            $table->text('explanation')->nullable();
            $table->json('settings')->nullable(); // case_sensitive, max_words, etc.
            $table->timestamps();
            $table->softDeletes();

            $table->index(['quiz_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
