<?php

namespace Tests\Feature;

use App\Models\ClassSchedule;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClassScheduleTest extends TestCase
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

    public function test_admin_can_view_class_schedules_for_any_course(): void
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
        $schedule = ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Mon',
            'start_time' => '08:00:00',
            'end_time' => '10:00:00',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.classSchedules')
            ->assertJsonPath('data.classSchedules.0.id', $schedule->id);
    }

    public function test_lecturer_can_view_schedules_for_course_they_teach(): void
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
        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Tue',
            'start_time' => '13:00:00',
            'end_time' => '15:00:00',
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.classSchedules');
    }

    public function test_student_can_view_schedules_for_enrolled_course(): void
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
        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Wed',
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
        ]);

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.classSchedules');
    }

    public function test_unrelated_user_cannot_view_class_schedules(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $course = Course::factory()->create();

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertForbidden();
    }

    public function test_guest_cannot_view_class_schedules(): void
    {
        $course = Course::factory()->create();

        $response = $this->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertUnauthorized();
    }

    public function test_class_schedules_are_ordered_by_day_then_start_time(): void
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

        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Fri',
            'start_time' => '08:00:00',
            'end_time' => '10:00:00',
        ]);
        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Mon',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
        ]);
        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Mon',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/class-schedules");

        $response->assertOk()
            ->assertJsonPath('data.classSchedules.0.dayOfWeek', 'Mon')
            ->assertJsonPath('data.classSchedules.0.startTime', '08:00:00')
            ->assertJsonPath('data.classSchedules.1.dayOfWeek', 'Mon')
            ->assertJsonPath('data.classSchedules.1.startTime', '10:00:00')
            ->assertJsonPath('data.classSchedules.2.dayOfWeek', 'Fri');
    }

    public function test_course_summary_includes_class_schedules(): void
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
        ClassSchedule::factory()->create([
            'course_offering_id' => $offering->id,
            'day_of_week' => 'Thu',
            'start_time' => '14:00:00',
            'end_time' => '16:00:00',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/summary");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.classSchedules')
            ->assertJsonPath('data.classSchedules.0.dayOfWeek', 'Thu');
    }
}
