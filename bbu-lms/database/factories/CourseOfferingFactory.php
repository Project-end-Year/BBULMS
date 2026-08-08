<?php

namespace Database\Factories;

use App\Models\CourseOffering;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseOffering>
 */
class CourseOfferingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => null,
            'semester_id' => null,
            'lecturer_id' => null,
            'capacity' => fake()->numberBetween(20, 60),
            'section' => fake()->randomElement(['A', 'B', 'C']),
            'room' => fake()->buildingNumber() . '-' . fake()->numberBetween(100, 400),
            'schedule' => null,
            'is_active' => true,
        ];
    }
}
