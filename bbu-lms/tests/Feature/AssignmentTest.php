<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function createOfferingContext(): array
    {
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);
        $semester = Semester::factory()->create();
        $course = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
        ]);
        $lecturer = User::factory()->create()->assignRole('lecturer');
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        return compact('course', 'lecturer', 'offering');
    }

    public function test_lecturer_can_create_assignment(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments",
            [
                'title' => 'Homework 1',
                'description' => 'Solve problems 1-10',
                'dueAt' => now()->addDays(7)->toDateTimeString(),
                'maxPoints' => 100,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.assignment.title', 'Homework 1')
            ->assertJsonPath('data.assignment.maxPoints', '100.00');
    }

    public function test_student_cannot_create_assignment(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments",
            [
                'title' => 'Homework',
                'dueAt' => now()->toDateTimeString(),
            ]
        );

        $response->assertForbidden();
    }

    public function test_student_can_list_published_assignments(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'is_published' => true,
        ]);
        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'is_published' => false,
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/assignments"
        );

        $response->assertOk()->assertJsonCount(1, 'data.assignments');
    }

    public function test_lecturer_can_update_assignment(): void
    {
        $context = $this->createOfferingContext();
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
        ]);

        $response = $this->actingAs($context['lecturer'])->putJson(
            "/api/course-offerings/{$context['offering']->id}/assignments/{$assignment->id}",
            [
                'title' => 'Updated title',
                'dueAt' => $assignment->due_at,
            ]
        );

        $response->assertOk()->assertJsonPath('data.assignment.title', 'Updated title');
    }

    public function test_student_can_submit_assignment(): void
    {
        Storage::fake('local');
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'due_at' => now()->addDays(1),
        ]);

        $file = UploadedFile::fake()->create('essay.pdf', 100, 'application/pdf');

        $this->assertTrue(
            $student->enrollments()
                ->where('course_offering_id', $context['offering']->id)
                ->where('status', 'enrolled')
                ->exists(),
            'Student should be enrolled'
        );
        $this->assertTrue(\Illuminate\Support\Facades\Gate::forUser($student)->allows('submit', $assignment));

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments/{$assignment->id}/submissions",
            [
                'submissionText' => 'My submission',
                'files' => [$file],
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.submission.submissionText', 'My submission')
            ->assertJsonPath('data.submission.status', 'submitted');
    }

    public function test_student_cannot_exceed_attempts(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'allowed_attempts' => 1,
            'due_at' => now()->addDays(1),
        ]);
        AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'attempt_number' => 1,
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments/{$assignment->id}/submissions",
            ['submissionText' => 'Second attempt']
        );

        $response->assertStatus(403);
    }

    public function test_lecturer_can_grade_submission(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'max_points' => 100,
        ]);
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments/{$assignment->id}/submissions/{$submission->id}/grade",
            [
                'grade' => 85,
                'feedback' => 'Good work',
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.submission.grade', '85.00')
            ->assertJsonPath('data.submission.feedback', 'Good work')
            ->assertJsonPath('data.submission.status', 'graded');
    }

    public function test_student_cannot_grade_submission(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'max_points' => 100,
        ]);
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments/{$assignment->id}/submissions/{$submission->id}/grade",
            ['grade' => 100]
        );

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_assignment_routes(): void
    {
        $this->getJson('/api/course-offerings/1/assignments')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/assignments')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/assignments/1')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/assignments/1/submissions')->assertUnauthorized();
    }
}
