<?php

namespace Database\Factories;

use App\Models\ClassSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassSchedule>
 */
class ClassScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_offering_id' => null,
            'day_of_week' => fake()->randomElement(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
            'start_time' => fake()->time('08:00', '16:00'),
            'end_time' => fake()->time('17:00', '18:00'),
            'room' => fake()->buildingNumber() . '-' . fake()->numberBetween(100, 400),
            'type' => fake()->randomElement(['lecture', 'lab', 'tutorial']),
            'is_active' => true,
        ];
    }
}
