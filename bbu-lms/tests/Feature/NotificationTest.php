<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceSession;
use App\Models\CalendarEvent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Program;
use App\Models\Semester;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationTest extends TestCase
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

    public function test_user_can_list_notifications(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/notifications');

        $response->assertOk()
            ->assertJsonCount(3, 'data.notifications')
            ->assertJsonPath('data.unreadCount', 3);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertOk()->assertJsonPath('data.read', true);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_others_notification_as_read(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertForbidden();
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/notifications/mark-all-read');

        $response->assertOk()->assertJsonPath('data.read', true);
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'read_at' => null,
        ]);
    }

    public function test_creating_university_announcement_notifies_all_users(): void
    {
        $admin = User::factory()->create()->assignRole('admin');
        $user = User::factory()->create();

        $course = Course::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/courses/{$course->id}/announcements", [
            'title' => 'University Notice',
            'content' => 'Important update',
            'scope' => 'university',
            'isPublished' => true,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'announcement',
            'title' => 'New university announcement',
        ]);
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $admin->id,
            'type' => 'announcement',
        ]);
    }

    public function test_sending_message_notifies_participants(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $conversation = Conversation::factory()->create(['type' => 'direct']);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);
        ConversationParticipant::factory()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $other->id,
        ]);

        $response = $this->actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
            'content' => 'Hello there!',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $other->id,
            'type' => 'chat_message',
        ]);
    }

    public function test_creating_exam_calendar_event_notifies_enrolled_students(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson('/api/calendar/events', [
            'title' => 'Mid-term',
            'type' => 'exam',
            'startAt' => now()->addDays(7)->toDateTimeString(),
            'courseOfferingId' => $context['offering']->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'type' => 'exam_reminder',
            'title' => 'Upcoming exam: Mid-term',
        ]);
    }

    public function test_creating_published_assignment_notifies_enrolled_students(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments",
            [
                'title' => 'Lab Report 1',
                'dueAt' => now()->addDays(3)->toDateTimeString(),
                'isPublished' => true,
            ]
        );

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'type' => 'new_assignment',
            'title' => 'New assignment: Lab Report 1',
        ]);
    }

    public function test_saving_manual_grade_notifies_student(): void
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
            'weight' => 30,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => $component->id,
                'percentage' => 85,
            ]
        );

        $response->assertOk();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'type' => 'new_grade',
            'title' => 'New grade posted: Midterm',
        ]);
    }

    public function test_creating_attendance_session_notifies_enrolled_students(): void
    {
        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/attendance-sessions",
            [
                'title' => 'Week 3 Check-in',
                'startsAt' => now()->toDateTimeString(),
                'endsAt' => now()->addHour()->toDateTimeString(),
            ]
        );

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'type' => 'attendance_reminder',
        ]);
    }

    public function test_notification_created_event_is_broadcast(): void
    {
        Event::fake([\App\Events\NotificationCreated::class]);

        $context = $this->createCourseContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/assignments",
            [
                'title' => 'Broadcast Check',
                'dueAt' => now()->addDays(3)->toDateTimeString(),
                'isPublished' => true,
            ]
        );

        Event::assertDispatched(\App\Events\NotificationCreated::class);
    }

    public function test_guest_cannot_access_notification_routes(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->postJson('/api/notifications/1/read')->assertUnauthorized();
        $this->postJson('/api/notifications/mark-all-read')->assertUnauthorized();
    }
}
