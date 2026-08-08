<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->syncRoles(['admin']);

        return $user;
    }

    public function test_admin_can_view_any_course_summary(): void
    {
        $admin = $this->admin();
        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/summary");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.course.id', $course->id)
            ->assertJsonPath('data.context.role', 'admin')
            ->assertJsonCount(1, 'data.offerings')
            ->assertJsonPath('data.offerings.0.id', $offering->id);
    }

    public function test_lecturer_can_view_summary_for_course_they_teach(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);

        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/courses/{$course->id}/summary");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.context.role', 'lecturer')
            ->assertJsonPath('data.context.offeringId', $offering->id);
    }

    public function test_student_can_view_summary_for_course_they_are_enrolled_in(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/summary");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.context.role', 'student')
            ->assertJsonPath('data.context.offeringId', $offering->id);
    }

    public function test_unrelated_user_cannot_view_course_summary(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $course = Course::factory()->create();

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/summary");

        $response->assertForbidden();
    }

    public function test_guest_cannot_view_course_summary(): void
    {
        $course = Course::factory()->create();

        $response = $this->getJson("/api/courses/{$course->id}/summary");

        $response->assertUnauthorized();
    }
}
