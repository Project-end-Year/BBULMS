<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceTest extends TestCase
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

    public function test_lecturer_can_create_attendance_session(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-sessions",
            [
                'title' => 'Week 3 Lecture',
                'startsAt' => now()->toDateTimeString(),
                'lateThresholdMinutes' => 10,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.session.title', 'Week 3 Lecture')
            ->assertJsonPath('data.session.isActive', true);

        $this->assertDatabaseCount('attendance_records', 1);
    }

    public function test_student_cannot_create_attendance_session(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-sessions",
            ['startsAt' => now()->toDateTimeString()]
        );

        $response->assertForbidden();
    }

    public function test_student_can_check_in_with_code(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
            'starts_at' => now()->subMinutes(5),
            'ends_at' => now()->addHour(),
            'code' => 'A1B2C3',
            'is_active' => true,
        ]);

        $this->assertTrue(
            $student->enrollments()->where('course_offering_id', $context['offering']->id)->where('status', 'enrolled')->exists(),
            'Student should be enrolled'
        );
        $this->assertTrue(
            \Illuminate\Support\Facades\Gate::forUser($student)->allows('checkIn', $session),
            'Gate should allow check-in'
        );

        $this->actingAs($student);

        $response = $this->postJson('/api/attendance/check-in', [
            'code' => 'A1B2C3',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.record.status', 'present')
            ->assertJsonPath('data.record.checkInMethod', 'code');

        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);
    }

    public function test_student_cannot_check_in_after_session_ends(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
            'starts_at' => now()->subHours(2),
            'ends_at' => now()->subMinute(),
            'code' => 'EXPIRED',
            'is_active' => true,
        ]);

        $response = $this->actingAs($student)->postJson('/api/attendance/check-in', [
            'code' => 'EXPIRED',
        ]);

        $response->assertStatus(403);
    }

    public function test_lecturer_can_manually_update_attendance_record(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);
        $record = AttendanceRecord::factory()->create([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'absent',
        ]);

        $response = $this->actingAs($context['lecturer'])->putJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-sessions/{$session->id}/records/{$record->id}",
            ['status' => 'present']
        );

        $response->assertOk()
            ->assertJsonPath('data.record.status', 'present');
    }

    public function test_student_cannot_override_attendance_record(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);
        $record = AttendanceRecord::factory()->create([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'absent',
        ]);

        $response = $this->actingAs($student)->putJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-sessions/{$session->id}/records/{$record->id}",
            ['status' => 'present']
        );

        $response->assertForbidden();
    }

    public function test_student_can_view_own_attendance_history(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);
        AttendanceRecord::factory()->create([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-history"
        );

        $response->assertOk()
            ->assertJsonPath('data.summary.total', 1)
            ->assertJsonPath('data.summary.present', 1)
            ->assertJsonPath('data.summary.percentage', 100);
    }

    public function test_guest_cannot_access_attendance_routes(): void
    {
        $this->getJson('/api/course-offerings/1/attendance-sessions')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/attendance-sessions')->assertUnauthorized();
        $this->postJson('/api/attendance/check-in')->assertUnauthorized();
    }
}
