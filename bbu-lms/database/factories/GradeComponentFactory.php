<?php

namespace Database\Factories;

use App\Models\GradeComponent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradeComponent>
 */
class GradeComponentFactory extends Factory
{
    protected $model = GradeComponent::class;

    public function definition(): array
    {
        return [
            'course_offering_id' => null,
            'name' => $this->faker->words(2, true),
            'type' => $this->faker->randomElement(['assignment', 'attendance', 'midterm', 'final', 'custom']),
            'weight' => $this->faker->randomFloat(2, 5, 40),
            'order' => 0,
            'settings' => null,
        ];
    }
}
