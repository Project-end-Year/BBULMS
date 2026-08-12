<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssignmentSubmission>
 */
class AssignmentSubmissionFactory extends Factory
{
    protected $model = AssignmentSubmission::class;

    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'student_id' => User::factory(),
            'attempt_number' => 1,
            'submission_text' => $this->faker->optional()->paragraph(),
            'files' => null,
            'submitted_at' => now(),
            'grade' => null,
            'feedback' => null,
            'graded_by' => null,
            'graded_at' => null,
            'status' => 'submitted',
        ];
    }
}
