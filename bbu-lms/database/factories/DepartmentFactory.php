<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('???'),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'faculty_id' => null,
            'is_active' => true,
        ];
    }
}
