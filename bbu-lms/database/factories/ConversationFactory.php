<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'type' => 'direct',
            'title' => null,
            'description' => null,
            'course_offering_id' => null,
            'created_by' => User::factory(),
            'is_active' => true,
        ];
    }

    public function group(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'group',
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(6),
        ]);
    }

    public function course(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'course',
            'course_offering_id' => CourseOffering::factory(),
            'title' => fake()->sentence(3),
        ]);
    }
}
