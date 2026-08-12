<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\CalendarEvent;
use App\Models\ClassSchedule;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Quiz;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CalendarAggregationTest extends TestCase
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

        return [
            'department' => $department,
            'program' => $program,
            'semester' => $semester,
            'course' => $course,
            'lecturer' => $lecturer,
            'offering' => $offering,
        ];
    }

    public function test_feed_requires_date_range(): void
    {
        $student = User::factory()->create()->assignRole('student');

        $this->actingAs($student)->getJson('/api/calendar')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start', 'end']);
    }

    public function test_feed_includes_manual_calendar_events(): void
    {
        $student = User::factory()->create()->assignRole('student');
        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        CalendarEvent::factory()->create([
            'created_by' => $student->id,
            'course_offering_id' => null,
            'start_at' => now()->addDays(2),
            'type' => 'event',
        ]);

        $response = $this->actingAs($student)->getJson('/api/calendar?'.http_build_query([
            'start' => $start,
            'end' => $end,
        ]));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.type', 'event')
            ->assertJsonPath('data.events.0.sourceType', null);
    }

    public function test_feed_includes_class_schedule_occurrences(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $targetDate = now()->addWeeks(1)->startOfWeek();
        $dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $dayName = $dayNames[$targetDate->dayOfWeek];

        ClassSchedule::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'day_of_week' => $dayName,
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'room' => 'A-101',
            'is_active' => true,
        ]);

        $start = $targetDate->format('Y-m-d');
        $end = $targetDate->format('Y-m-d');

        $response = $this->actingAs($student)->getJson('/api/calendar?'.http_build_query([
            'start' => $start,
            'end' => $end,
        ]));

        $response->assertOk()
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.type', 'class')
            ->assertJsonPath('data.events.0.sourceType', 'class_schedule')
            ->assertJsonPath('data.events.0.location', 'A-101');
    }

    public function test_feed_includes_published_assignment_due_dates(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $due = now()->addDays(3);
        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'due_at' => $due,
            'is_published' => true,
            'title' => 'Mid-term Essay',
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        $response = $this->actingAs($student)->getJson('/api/calendar?'.http_build_query([
            'start' => $start,
            'end' => $end,
        ]));

        $response->assertOk()
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.type', 'assignment')
            ->assertJsonPath('data.events.0.sourceType', 'assignment')
            ->assertJsonPath('data.events.0.title', 'Mid-term Essay');
    }

    public function test_feed_includes_published_exam_quizzes(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $examStart = now()->addDays(5);
        Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'type' => 'exam',
            'is_published' => true,
            'starts_at' => $examStart,
            'ends_at' => $examStart->clone()->addHours(2),
            'title' => 'Final Exam',
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        $response = $this->actingAs($student)->getJson('/api/calendar?'.http_build_query([
            'start' => $start,
            'end' => $end,
        ]));

        $response->assertOk()
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.type', 'exam')
            ->assertJsonPath('data.events.0.sourceType', 'quiz')
            ->assertJsonPath('data.events.0.title', 'Final Exam');
    }

    public function test_feed_hides_unpublished_assignments_from_students(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'due_at' => now()->addDays(3),
            'is_published' => false,
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        $this->actingAs($student)
            ->getJson('/api/calendar?'.http_build_query(['start' => $start, 'end' => $end]))
            ->assertOk()
            ->assertJsonCount(0, 'data.events');
    }

    public function test_feed_hides_other_students_enrolled_offerings(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        $otherStudent = User::factory()->create()->assignRole('student');

        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $otherStudent->id,
            'status' => 'enrolled',
        ]);

        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'due_at' => now()->addDays(3),
            'is_published' => true,
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        $this->actingAs($student)
            ->getJson('/api/calendar?'.http_build_query(['start' => $start, 'end' => $end]))
            ->assertOk()
            ->assertJsonCount(0, 'data.events');
    }

    public function test_lecturer_sees_own_offering_items(): void
    {
        $context = $this->createCourseContext();

        Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'due_at' => now()->addDays(3),
            'is_published' => true,
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        $this->actingAs($context['lecturer'])
            ->getJson('/api/calendar?'.http_build_query(['start' => $start, 'end' => $end]))
            ->assertOk()
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.sourceType', 'assignment');
    }

    public function test_guest_cannot_access_feed(): void
    {
        $this->getJson('/api/calendar?start='.now()->format('Y-m-d').'&end='.now()->addDay()->format('Y-m-d'))
            ->assertUnauthorized();
    }
}
