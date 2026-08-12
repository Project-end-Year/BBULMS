<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['multiple_choice', 'true_false', 'short_answer']);

        return [
            'quiz_id' => Quiz::factory(),
            'type' => $type,
            'prompt' => $this->faker->sentence(6) . '?',
            'points' => $this->faker->randomElement([1, 2, 5, 10]),
            'order' => 0,
            'explanation' => $this->faker->optional()->sentence(),
            'settings' => null,
        ];
    }

    public function multipleChoice(): static
    {
        return $this->state(fn (array $attributes) => ['type' => 'multiple_choice']);
    }

    public function trueFalse(): static
    {
        return $this->state(fn (array $attributes) => ['type' => 'true_false']);
    }

    public function shortAnswer(): static
    {
        return $this->state(fn (array $attributes) => ['type' => 'short_answer']);
    }
}
