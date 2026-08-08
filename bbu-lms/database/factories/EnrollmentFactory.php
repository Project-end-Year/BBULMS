<?php

namespace Database\Factories;

use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
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
            'student_id' => null,
            'status' => 'enrolled',
            'enrolled_at' => now(),
            'dropped_at' => null,
            'final_grade' => null,
            'is_active' => true,
        ];
    }
}
