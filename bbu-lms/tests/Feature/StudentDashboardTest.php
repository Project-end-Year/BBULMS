<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\ClassSchedule;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Message;
use App\Models\Program;
use App\Models\Quiz;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentDashboardTest extends TestCase
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

    public function test_student_dashboard_returns_aggregated_data(): void
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
            'room' => 'A-101',
            'type' => 'lecture',
            'is_active' => true,
        ]);

        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'title' => 'Due Soon',
            'due_at' => now()->addDays(2),
            'is_published' => true,
        ]);

        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Quiz 1',
            'type' => 'manual',
            'weight' => 20,
        ]);

        Grade::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'grade_component_id' => $component->id,
            'percentage' => 88,
            'letter_grade' => 'B',
        ]);

        Quiz::factory()->published()->exam()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'title' => 'Final Exam',
            'starts_at' => now()->addDays(10),
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

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $student->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $student->id,
            'last_read_at' => null,
        ]);
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $context['lecturer']->id,
        ]);

        $response = $this->actingAs($student)->getJson('/api/dashboard/student');

        $response->assertOk();
        $data = $response->json('data');

        $this->assertCount(1, $data['todaysClasses']);
        $this->assertCount(1, $data['upcomingAssignments']);
        $this->assertCount(1, $data['recentGrades']);
        $this->assertCount(1, $data['upcomingExams']);
        $this->assertSame(1, $data['unreadMessages']);
        $this->assertEqualsWithDelta(100, $data['attendancePercentage'], 0.01);
    }

    public function test_unread_messages_only_count_conversations_with_new_messages(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $conversation = Conversation::factory()->create(['type' => 'direct', 'created_by' => $student->id]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $student->id,
            'last_read_at' => now(),
        ]);
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $context['lecturer']->id,
            'created_at' => now()->subMinutes(5),
        ]);

        $response = $this->actingAs($student)->getJson('/api/dashboard/student');

        $response->assertOk();
        $this->assertSame(0, $response->json('data.unreadMessages'));
    }

    public function test_student_with_no_enrollments_gets_empty_payload(): void
    {
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->getJson('/api/dashboard/student');

        $response->assertOk();
        $response->assertJsonPath('data.todaysClasses', []);
        $response->assertJsonPath('data.upcomingAssignments', []);
        $response->assertJsonPath('data.recentGrades', []);
        $response->assertJsonPath('data.upcomingExams', []);
        $response->assertJsonPath('data.unreadMessages', 0);
        $this->assertNull($response->json('data.attendancePercentage'));
    }

    public function test_non_student_cannot_access_student_dashboard(): void
    {
        $lecturer = User::factory()->create()->assignRole('lecturer');

        $response = $this->actingAs($lecturer)->getJson('/api/dashboard/student');

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_dashboard_routes(): void
    {
        $this->getJson('/api/dashboard/student')->assertUnauthorized();
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
    }

    public function test_dashboard_summary_returns_role_and_course_count(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->getJson('/api/dashboard/summary');

        $response->assertOk()
            ->assertJsonPath('data.isStudent', true)
            ->assertJsonPath('data.courseCount', 1);
    }
}
