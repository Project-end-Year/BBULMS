<?php

namespace Database\Factories;

use App\Models\CourseMaterialView;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseMaterialView>
 */
class CourseMaterialViewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_material_id' => null,
            'student_id' => null,
            'action' => fake()->randomElement(['view', 'download']),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'viewed_at' => now(),
        ];
    }
}
