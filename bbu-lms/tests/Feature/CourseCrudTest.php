<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseCrudTest extends TestCase
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

    public function test_admin_can_list_all_courses(): void
    {
        $admin = $this->admin();
        Course::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/courses');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.courses');
    }

    public function test_admin_can_create_course(): void
    {
        $admin = $this->admin();
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/courses', [
            'code' => 'CS401',
            'name' => 'Machine Learning',
            'description' => 'Advanced ML course.',
            'credits' => 3,
            'departmentId' => $department->id,
            'programId' => $program->id,
            'isActive' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'CS401');

        $this->assertDatabaseHas('courses', [
            'code' => 'CS401',
            'name' => 'Machine Learning',
            'department_id' => $department->id,
        ]);
    }

    public function test_admin_can_update_course(): void
    {
        $admin = $this->admin();
        $course = Course::factory()->create();

        $response = $this->actingAs($admin)->putJson("/api/admin/courses/{$course->id}", [
            'code' => $course->code,
            'name' => 'Updated Course Name',
            'credits' => 4,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Course Name');

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'name' => 'Updated Course Name',
            'credits' => 4,
        ]);
    }

    public function test_admin_can_toggle_course_active_status(): void
    {
        $admin = $this->admin();
        $course = Course::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/courses/{$course->id}");

        $response->assertOk()
            ->assertJsonPath('data.isActive', false);

        $this->assertDatabaseHas('courses', ['id' => $course->id, 'is_active' => false]);
    }

    public function test_non_admin_cannot_create_course(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);

        $response = $this->actingAs($lecturer)->postJson('/api/admin/courses', [
            'code' => 'CS999',
            'name' => 'Unauthorized Course',
            'credits' => 3,
        ]);

        $response->assertForbidden();
    }

    public function test_lecturer_my_courses_only_returns_taught_offerings(): void
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

        CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
        ]);

        $response = $this->actingAs($lecturer)->getJson('/api/my-courses');

        $response->assertOk()
            ->assertJsonCount(1, 'data.offerings')
            ->assertJsonPath('data.offerings.0.id', $offering->id);
    }

    public function test_student_my_courses_only_returns_enrolled_offerings(): void
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

        CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
        ]);

        $response = $this->actingAs($student)->getJson('/api/my-courses');

        $response->assertOk()
            ->assertJsonCount(1, 'data.offerings')
            ->assertJsonPath('data.offerings.0.id', $offering->id);
    }

    public function test_student_cannot_see_unrelated_course(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $course = Course::factory()->create();

        $response = $this->actingAs($student)->getJson("/api/admin/courses/{$course->id}");

        $response->assertForbidden();
    }
}
