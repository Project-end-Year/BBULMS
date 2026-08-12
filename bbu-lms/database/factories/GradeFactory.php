<?php

namespace Database\Factories;

use App\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    public function definition(): array
    {
        return [
            'course_offering_id' => null,
            'student_id' => null,
            'grade_component_id' => null,
            'points' => null,
            'max_points' => null,
            'percentage' => null,
            'letter_grade' => null,
            'feedback' => null,
        ];
    }
}
