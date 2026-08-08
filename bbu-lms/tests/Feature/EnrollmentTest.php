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

class EnrollmentTest extends TestCase
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

    private function createOffering(?User $lecturer = null): CourseOffering
    {
        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);

        return CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer?->id,
            'capacity' => 30,
        ]);
    }

    public function test_admin_can_enroll_student(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $response = $this->actingAs($admin)->postJson("/api/course-offerings/{$offering->id}/enrollments", [
            'studentId' => $student->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.student.id', $student->id)
            ->assertJsonPath('data.status', 'enrolled');

        $this->assertDatabaseHas('enrollments', [
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
    }

    public function test_lecturer_can_enroll_student_in_own_offering(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $response = $this->actingAs($lecturer)->postJson("/api/course-offerings/{$offering->id}/enrollments", [
            'studentId' => $student->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.student.id', $student->id);
    }

    public function test_lecturer_cannot_enroll_in_other_offering(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $otherLecturer = User::factory()->create();
        $otherLecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($otherLecturer);
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $response = $this->actingAs($lecturer)->postJson("/api/course-offerings/{$offering->id}/enrollments", [
            'studentId' => $student->id,
        ]);

        $response->assertForbidden();
    }

    public function test_student_can_self_enroll(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();

        $response = $this->actingAs($student)->postJson("/api/course-offerings/{$offering->id}/enrollments", []);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.student.id', $student->id);
    }

    public function test_student_cannot_self_enroll_when_full(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);
        $offering->update(['capacity' => 1]);

        $otherStudent = User::factory()->create();
        $otherStudent->syncRoles(['student']);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $otherStudent->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->postJson("/api/course-offerings/{$offering->id}/enrollments", []);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.capacity', ['This course offering is full.']);
    }

    public function test_duplicate_enrollment_returns_422(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/course-offerings/{$offering->id}/enrollments", [
            'studentId' => $student->id,
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.studentId', ['This student is already enrolled in the offering.']);
    }

    public function test_admin_can_drop_student(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/course-offerings/{$offering->id}/enrollments/{$student->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'dropped');

        $this->assertDatabaseHas('enrollments', [
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'dropped',
        ]);
    }

    public function test_student_can_drop_self(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->deleteJson("/api/course-offerings/{$offering->id}/enrollments/{$student->id}");

        $response->assertOk()
            ->assertJsonPath('data.status', 'dropped');
    }

    public function test_student_cannot_drop_other_student(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $otherStudent = User::factory()->create();
        $otherStudent->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $otherStudent->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->deleteJson("/api/course-offerings/{$offering->id}/enrollments/{$otherStudent->id}");

        $response->assertForbidden();
    }

    public function test_admin_can_list_enrollments(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/course-offerings/{$offering->id}/enrollments");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.enrollments')
            ->assertJsonPath('data.enrolledCount', 1)
            ->assertJsonPath('data.capacity', 30);
    }

    public function test_student_cannot_list_enrollments(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();

        $response = $this->actingAs($student)->getJson("/api/course-offerings/{$offering->id}/enrollments");

        $response->assertForbidden();
    }

    public function test_student_search_requires_admin_or_lecturer(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $response = $this->actingAs($student)->getJson('/api/students/search?query=john');

        $response->assertForbidden();
    }

    public function test_student_search_returns_students_only(): void
    {
        $admin = $this->admin();
        $student = User::factory()->create(['name' => 'Johnny Student']);
        $student->syncRoles(['student']);
        $lecturer = User::factory()->create(['name' => 'Johnny Lecturer']);
        $lecturer->syncRoles(['lecturer']);

        $response = $this->actingAs($admin)->getJson('/api/students/search?query=Johnny');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.students')
            ->assertJsonPath('data.students.0.id', $student->id);
    }
}
