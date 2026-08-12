<?php

namespace Database\Factories;

use App\Models\CalendarEvent;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CalendarEvent>
 */
class CalendarEventFactory extends Factory
{
    protected $model = CalendarEvent::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-1 month', '+1 month');

        return [
            'created_by' => User::factory(),
            'course_id' => null,
            'course_offering_id' => null,
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->paragraph(),
            'type' => $this->faker->randomElement(['class', 'assignment', 'quiz', 'exam', 'event']),
            'start_at' => $start,
            'end_at' => $this->faker->optional()->dateTimeBetween($start, (clone $start)->modify('+2 hours')),
            'location' => $this->faker->optional()->buildingNumber(),
            'is_all_day' => $this->faker->boolean(20),
            'color' => $this->faker->optional()->hexColor(),
        ];
    }

    public function forCourse(Course $course): static
    {
        return $this->state(fn (array $attributes) => [
            'course_id' => $course->id,
        ]);
    }

    public function forOffering(CourseOffering $offering): static
    {
        return $this->state(fn (array $attributes) => [
            'course_offering_id' => $offering->id,
            'course_id' => $offering->course_id,
        ]);
    }
}
