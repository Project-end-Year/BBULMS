<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Message;
use App\Models\Semester;
use App\Models\User;
use App\Services\CourseConversationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseConversationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_course_conversation_service_creates_group_with_lecturer_and_students(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $course = Course::factory()->create(['code' => 'CS101', 'name' => 'Intro to CS']);
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
            'section' => 'A',
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $service = app(CourseConversationService::class);
        $conversation = $service->ensureForOffering($offering);

        $this->assertEquals('course', $conversation->type);
        $this->assertEquals($offering->id, $conversation->course_offering_id);
        $this->assertStringContainsString('CS101', $conversation->title);
        $this->assertCount(2, $conversation->fresh()->participants);
        $this->assertTrue($conversation->participants->contains(fn ($p) => $p->user_id === $lecturer->id && $p->role === 'admin'));
        $this->assertTrue($conversation->participants->contains(fn ($p) => $p->user_id === $student->id));
    }

    public function test_course_conversation_is_accessible_to_participant(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
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
            'lecturer_id' => $lecturer->id,
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $service = app(CourseConversationService::class);
        $service->ensureForOffering($offering);

        $response = $this->actingAs($student)->getJson("/api/course-offerings/{$offering->id}/conversation");

        $response->assertOk()
            ->assertJsonPath('data.conversation.type', 'course')
            ->assertJsonCount(2, 'data.conversation.participants');
    }

    public function test_non_participant_cannot_access_course_conversation(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $outsider = User::factory()->create();
        $outsider->syncRoles(['student']);
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
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $service = app(CourseConversationService::class);
        $service->ensureForOffering($offering);

        $response = $this->actingAs($outsider)->getJson("/api/course-offerings/{$offering->id}/conversation");

        $response->assertForbidden();
    }

    public function test_participant_can_list_messages_with_pagination(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
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
            'lecturer_id' => $lecturer->id,
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $service = app(CourseConversationService::class);
        $conversation = $service->ensureForOffering($offering);

        Message::factory()->count(30)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $lecturer->id,
        ]);

        $response = $this->actingAs($student)->getJson("/api/conversations/{$conversation->id}/messages?perPage=10");

        $response->assertOk()
            ->assertJsonCount(10, 'data.messages')
            ->assertJsonPath('data.pagination.perPage', 10);
    }

    public function test_non_participant_cannot_list_messages(): void
    {
        $user = User::factory()->create();
        $user->syncRoles(['student']);
        $conversation = Conversation::factory()->create(['type' => 'direct']);

        $response = $this->actingAs($user)->getJson("/api/conversations/{$conversation->id}/messages");

        $response->assertForbidden();
    }
}
