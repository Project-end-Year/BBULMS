<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('CS###'),
            'name' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'credits' => fake()->numberBetween(1, 4),
            'department_id' => null,
            'program_id' => null,
            'is_active' => true,
        ];
    }
}
