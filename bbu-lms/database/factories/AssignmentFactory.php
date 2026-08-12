<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Assignment>
 */
class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    public function definition(): array
    {
        return [
            'course_offering_id' => CourseOffering::factory(),
            'created_by' => User::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'instructions' => $this->faker->optional()->paragraph(),
            'due_at' => $this->faker->dateTimeBetween('+1 day', '+1 month'),
            'max_points' => $this->faker->randomElement([10.00, 25.00, 50.00, 100.00]),
            'allowed_attempts' => $this->faker->randomElement([1, 2, 3]),
            'allowed_file_types' => null,
            'max_file_size_mb' => 10,
            'is_published' => true,
        ];
    }
}
