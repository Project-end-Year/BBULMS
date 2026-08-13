<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function createCourseContext(): array
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

        return compact('department', 'program', 'semester', 'course', 'lecturer', 'offering');
    }

    public function test_guest_cannot_access_student_analytics(): void
    {
        $this->getJson('/api/analytics/student')
            ->assertStatus(401);
    }

    public function test_lecturers_are_blocked_from_student_analytics(): void
    {
        $lecturer = User::factory()->create()->assignRole('lecturer');

        $this->actingAs($lecturer)
            ->getJson('/api/analytics/student')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Only students can access student analytics.');
    }

    public function test_student_with_no_enrollments_receives_empty_payload(): void
    {
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)
            ->getJson('/api/analytics/student')
            ->assertOk()
            ->assertJsonPath('data.gradeTrend', [])
            ->assertJsonPath('data.attendanceTrend', [])
            ->assertJsonPath('data.courseSnapshots', [])
            ->assertJsonPath('data.assignmentCompletionRate.rate', null)
            ->assertJsonPath('data.assignmentCompletionRate.totalCount', 0)
            ->assertJsonPath('data.atRiskFlag.isAtRisk', false);

        $this->assertIsArray($response->json('data'));
    }

    public function test_student_analytics_aggregate_grades_attendance_and_assignments(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Midterm',
            'type' => 'manual',
            'weight' => 100,
        ]);

        Grade::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'grade_component_id' => $component->id,
            'percentage' => 85,
            'letter_grade' => 'B',
        ]);

        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'is_published' => true,
            'max_points' => 100,
        ]);

        AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'grade' => 80,
            'status' => 'graded',
        ]);

        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
            'starts_at' => now()->startOfMonth()->addDays(5),
        ]);

        AttendanceRecord::factory()->create([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
            'checked_in_at' => now(),
        ]);

        $response = $this->actingAs($student)
            ->getJson('/api/analytics/student')
            ->assertOk();

        $data = $response->json('data');

        $this->assertCount(1, $data['courseSnapshots']);
        $snapshot = $data['courseSnapshots'][0];
        $this->assertEquals(85.0, $snapshot['overallPercentage']);
        $this->assertEquals('B', $snapshot['letterGrade']);
        $this->assertEquals(100.0, $snapshot['attendanceRate']);
        $this->assertEquals(100.0, $snapshot['assignmentCompletionRate']);

        $this->assertCount(1, $data['gradeTrend']);
        $this->assertEquals($context['semester']->id, $data['gradeTrend'][0]['semesterId']);
        $this->assertEquals(85.0, $data['gradeTrend'][0]['averagePercentage']);

        $this->assertCount(1, $data['attendanceTrend']);
        $this->assertEquals(100.0, $data['attendanceTrend'][0]['rate']);

        $this->assertEquals(100.0, $data['assignmentCompletionRate']['rate']);
        $this->assertEquals(1, $data['assignmentCompletionRate']['completedCount']);
        $this->assertEquals(1, $data['assignmentCompletionRate']['totalCount']);

        $this->assertFalse($data['atRiskFlag']['isAtRisk']);
    }

    public function test_at_risk_flag_triggers_for_low_grade_and_low_attendance(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Final',
            'type' => 'manual',
            'weight' => 100,
        ]);

        Grade::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'grade_component_id' => $component->id,
            'percentage' => 55,
            'letter_grade' => 'F',
        ]);

        $session = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
            'starts_at' => now()->startOfMonth()->addDays(5),
        ]);

        AttendanceRecord::factory()->create([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'absent',
            'checked_in_at' => null,
        ]);

        $response = $this->actingAs($student)
            ->getJson('/api/analytics/student')
            ->assertOk();

        $data = $response->json('data');

        $this->assertTrue($data['atRiskFlag']['isAtRisk']);
        $this->assertCount(2, $data['atRiskFlag']['reasons']);
        $this->assertCount(1, $data['atRiskFlag']['lowGradeCourses']);
        $this->assertCount(1, $data['atRiskFlag']['lowAttendanceCourses']);
        $this->assertEquals(55.0, $data['atRiskFlag']['lowGradeCourses'][0]['overallPercentage']);
        $this->assertEquals(0.0, $data['atRiskFlag']['lowAttendanceCourses'][0]['attendanceRate']);
    }
}
