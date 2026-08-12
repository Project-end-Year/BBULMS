<?php

namespace Database\Factories;

use App\Models\CourseOffering;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    public function definition(): array
    {
        return [
            'course_offering_id' => CourseOffering::factory(),
            'created_by' => User::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->paragraph(),
            'type' => $this->faker->randomElement(['quiz', 'exam', 'practice']),
            'time_limit_minutes' => $this->faker->randomElement([15, 30, 45, 60, 90]),
            'attempts_allowed' => $this->faker->numberBetween(1, 3),
            'shuffle_questions' => $this->faker->boolean(),
            'show_correct_answers' => $this->faker->boolean(),
            'is_published' => $this->faker->boolean(),
            'starts_at' => null,
            'ends_at' => null,
            'total_points' => 0,
            'passing_score_percentage' => $this->faker->randomElement([50, 60, 70]),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => true]);
    }

    public function exam(): static
    {
        return $this->state(fn (array $attributes) => ['type' => 'exam']);
    }
}
