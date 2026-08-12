<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    protected $model = QuizAttempt::class;

    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'student_id' => User::factory(),
            'attempt_number' => 1,
            'started_at' => now(),
            'submitted_at' => null,
            'expires_at' => null,
            'score' => null,
            'max_score' => null,
            'percentage' => null,
            'status' => 'in_progress',
            'question_order' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitted_at' => now(),
            'status' => 'completed',
        ]);
    }
}
