<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceSession;
use App\Models\ClassSchedule;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\GradeComponent;
use App\Models\Program;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LecturerDashboardTest extends TestCase
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

    public function test_lecturer_dashboard_returns_aggregated_data(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $todayAbbrev = now()->format('D');
        ClassSchedule::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'day_of_week' => $todayAbbrev,
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'room' => 'B-202',
            'type' => 'lecture',
            'is_active' => true,
        ]);

        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'title' => 'Lab Report',
            'due_at' => now()->addDays(3),
            'is_published' => true,
        ]);

        AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'status' => 'submitted',
        ]);

        AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
            'is_active' => true,
        ]);

        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Midterm',
            'type' => 'manual',
            'weight' => 30,
        ]);

        // Simulate a low performer so performance glance has data.
        \App\Models\Grade::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'grade_component_id' => $component->id,
            'percentage' => 55,
            'letter_grade' => 'F',
        ]);

        $quiz = Quiz::factory()->published()->exam()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
        ]);
        $question = Question::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => 'short_answer',
            'points' => 5,
        ]);
        $attempt = QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'answer_text' => 'Answer text',
            'status' => 'pending_review',
            'points_possible' => 5,
        ]);

        $response = $this->actingAs($context['lecturer'])->getJson('/api/dashboard/lecturer');

        $response->assertOk();
        $data = $response->json('data');

        $this->assertCount(1, $data['todaysClasses']);
        $this->assertCount(1, $data['upcomingAssignments']);
        $this->assertCount(1, $data['attendanceStatus']['activeSessions']);
        $this->assertSame(2, $data['pendingGradingCount']);
        $this->assertCount(1, $data['studentPerformance']['lowPerformers']);
        $this->assertCount(1, $data['studentPerformance']['courseAverages']);
    }

    public function test_lecturer_with_no_offerings_gets_empty_payload(): void
    {
        $lecturer = User::factory()->create()->assignRole('lecturer');

        $response = $this->actingAs($lecturer)->getJson('/api/dashboard/lecturer');

        $response->assertOk();
        $response->assertJsonPath('data.todaysClasses', []);
        $response->assertJsonPath('data.pendingGradingCount', 0);
        $response->assertJsonPath('data.upcomingAssignments', []);
        $response->assertJsonPath('data.studentPerformance.lowPerformers', []);
        $response->assertJsonPath('data.studentPerformance.courseAverages', []);
    }

    public function test_non_lecturer_cannot_access_lecturer_dashboard(): void
    {
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->getJson('/api/dashboard/lecturer');

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_lecturer_dashboard(): void
    {
        $this->getJson('/api/dashboard/lecturer')->assertUnauthorized();
    }
}
