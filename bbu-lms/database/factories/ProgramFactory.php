<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'code' => fake()->unique()->bothify('P???'),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'duration_years' => fake()->numberBetween(3, 5),
            'is_active' => true,
        ];
    }
}
