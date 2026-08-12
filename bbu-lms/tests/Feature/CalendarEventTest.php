<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
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

class CalendarEventTest extends TestCase
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

    public function test_admin_can_list_all_events_in_range(): void
    {
        $admin = User::factory()->create()->assignRole('admin');
        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');

        CalendarEvent::factory()->count(3)->create([
            'start_at' => now()->addDays(5),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/calendar/events?'.http_build_query([
            'start' => $start,
            'end' => $end,
        ]));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.events');
    }

    public function test_lecturer_sees_own_events_and_offering_events(): void
    {
        $context = $this->createCourseContext();
        $otherLecturer = User::factory()->create()->assignRole('lecturer');

        CalendarEvent::factory()->create([
            'created_by' => $context['lecturer']->id,
            'start_at' => now()->addDays(2),
        ]);
        CalendarEvent::factory()->create([
            'created_by' => $otherLecturer->id,
            'course_offering_id' => $context['offering']->id,
            'start_at' => now()->addDays(3),
        ]);
        CalendarEvent::factory()->create([
            'created_by' => $otherLecturer->id,
            'start_at' => now()->addDays(4),
        ]);

        $response = $this->actingAs($context['lecturer'])->getJson('/api/calendar/events?'.http_build_query([
            'start' => now()->startOfMonth()->format('Y-m-d'),
            'end' => now()->endOfMonth()->format('Y-m-d'),
        ]));

        $response->assertOk()->assertJsonCount(2, 'data.events');
    }

    public function test_student_sees_enrolled_offering_events_and_global_events(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        CalendarEvent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'start_at' => now()->addDays(2),
        ]);
        CalendarEvent::factory()->create([
            'course_offering_id' => null,
            'start_at' => now()->addDays(3),
        ]);
        $otherOffering = CourseOffering::factory()->create([
            'course_id' => $context['course']->id,
            'semester_id' => $context['semester']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);
        CalendarEvent::factory()->create([
            'course_offering_id' => $otherOffering->id,
            'start_at' => now()->addDays(4),
        ]);

        $response = $this->actingAs($student)->getJson('/api/calendar/events?'.http_build_query([
            'start' => now()->startOfMonth()->format('Y-m-d'),
            'end' => now()->endOfMonth()->format('Y-m-d'),
        ]));

        $response->assertOk()->assertJsonCount(2, 'data.events');
    }

    public function test_lecturer_can_create_event(): void
    {
        $context = $this->createCourseContext();

        $response = $this->actingAs($context['lecturer'])->postJson('/api/calendar/events', [
            'title' => 'Mid-term Exam',
            'description' => 'Covering chapters 1-5',
            'type' => 'exam',
            'startAt' => now()->addDays(7)->toDateTimeString(),
            'endAt' => now()->addDays(7)->addHours(2)->toDateTimeString(),
            'location' => 'Room 101',
            'courseOfferingId' => $context['offering']->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.event.title', 'Mid-term Exam')
            ->assertJsonPath('data.event.type', 'exam');
    }

    public function test_student_cannot_create_event(): void
    {
        $student = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->postJson('/api/calendar/events', [
            'title' => 'Party',
            'type' => 'event',
            'startAt' => now()->toDateTimeString(),
        ]);

        $response->assertForbidden();
    }

    public function test_lecturer_cannot_create_event_for_others_offering(): void
    {
        $context = $this->createCourseContext();
        $otherLecturer = User::factory()->create()->assignRole('lecturer');

        $response = $this->actingAs($otherLecturer)->postJson('/api/calendar/events', [
            'title' => 'Unauthorized',
            'type' => 'class',
            'startAt' => now()->toDateTimeString(),
            'courseOfferingId' => $context['offering']->id,
        ]);

        $response->assertForbidden();
    }

    public function test_creator_can_update_own_event(): void
    {
        $context = $this->createCourseContext();
        $event = CalendarEvent::factory()->create([
            'created_by' => $context['lecturer']->id,
            'start_at' => now()->addDays(2),
        ]);

        $response = $this->actingAs($context['lecturer'])->putJson("/api/calendar/events/{$event->id}", [
            'title' => 'Updated title',
            'type' => $event->type,
            'startAt' => $event->start_at,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.event.title', 'Updated title');
    }

    public function test_non_creator_lecturer_cannot_update_others_event(): void
    {
        $context = $this->createCourseContext();
        $otherLecturer = User::factory()->create()->assignRole('lecturer');
        $event = CalendarEvent::factory()->create([
            'created_by' => $context['lecturer']->id,
            'start_at' => now()->addDays(2),
        ]);

        $response = $this->actingAs($otherLecturer)->putJson("/api/calendar/events/{$event->id}", [
            'title' => 'Updated title',
            'type' => $event->type,
            'startAt' => $event->start_at,
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_any_event(): void
    {
        $context = $this->createCourseContext();
        $admin = User::factory()->create()->assignRole('admin');
        $event = CalendarEvent::factory()->create([
            'created_by' => $context['lecturer']->id,
            'start_at' => now()->addDays(2),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/calendar/events/{$event->id}", [
            'title' => 'Admin updated',
            'type' => $event->type,
            'startAt' => $event->start_at,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.event.title', 'Admin updated');
    }

    public function test_creator_can_delete_own_event(): void
    {
        $context = $this->createCourseContext();
        $event = CalendarEvent::factory()->create([
            'created_by' => $context['lecturer']->id,
            'start_at' => now()->addDays(2),
        ]);

        $response = $this->actingAs($context['lecturer'])->deleteJson("/api/calendar/events/{$event->id}");

        $response->assertOk()->assertJsonPath('data.deleted', true);
        $this->assertDatabaseMissing('calendar_events', ['id' => $event->id]);
    }

    public function test_guest_cannot_access_calendar_routes(): void
    {
        $this->getJson('/api/calendar/events?start=2026-08-01&end=2026-08-31')->assertUnauthorized();
        $this->postJson('/api/calendar/events')->assertUnauthorized();
        $this->putJson('/api/calendar/events/1')->assertUnauthorized();
        $this->deleteJson('/api/calendar/events/1')->assertUnauthorized();
    }
}
