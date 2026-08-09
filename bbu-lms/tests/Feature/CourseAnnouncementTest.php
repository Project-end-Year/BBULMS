<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseAnnouncementTest extends TestCase
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

    private function createCourse(): Course
    {
        return Course::factory()->create();
    }

    private function enrollStudent(Course $course): User
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
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

        return $student;
    }

    public function test_admin_can_list_announcements(): void
    {
        $admin = $this->admin();
        $course = $this->createCourse();
        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Admin Notice',
            'is_published' => true,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.announcements')
            ->assertJsonPath('data.announcements.0.title', 'Admin Notice');
    }

    public function test_student_can_list_published_announcements_for_enrolled_course(): void
    {
        $course = $this->createCourse();
        $student = $this->enrollStudent($course);

        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Published Announcement',
            'is_published' => true,
        ]);
        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Draft Announcement',
            'is_published' => false,
        ]);

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertOk()
            ->assertJsonCount(1, 'data.announcements')
            ->assertJsonPath('data.announcements.0.title', 'Published Announcement');
    }

    public function test_manager_can_see_draft_announcements(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $course = $this->createCourse();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Draft',
            'is_published' => false,
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertOk()
            ->assertJsonCount(1, 'data.announcements')
            ->assertJsonPath('data.announcements.0.title', 'Draft');
    }

    public function test_pinned_announcements_appear_first(): void
    {
        $admin = $this->admin();
        $course = $this->createCourse();

        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Regular',
            'is_pinned' => false,
            'created_at' => now()->subDay(),
        ]);
        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Pinned',
            'is_pinned' => true,
            'created_at' => now()->subDays(2),
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertOk()
            ->assertJsonPath('data.announcements.0.title', 'Pinned');
    }

    public function test_unrelated_user_cannot_list_announcements(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $course = $this->createCourse();

        $response = $this->actingAs($student)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertForbidden();
    }

    public function test_guest_cannot_list_announcements(): void
    {
        $course = $this->createCourse();

        $response = $this->getJson("/api/courses/{$course->id}/announcements");

        $response->assertUnauthorized();
    }

    public function test_admin_can_post_announcement(): void
    {
        $admin = $this->admin();
        $course = $this->createCourse();

        $response = $this->actingAs($admin)->postJson("/api/courses/{$course->id}/announcements", [
            'title' => 'Important Notice',
            'content' => 'Please read this carefully.',
            'isPinned' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Important Notice')
            ->assertJsonPath('data.isPinned', true);

        $this->assertDatabaseHas('announcements', [
            'course_id' => $course->id,
            'title' => 'Important Notice',
            'posted_by' => $admin->id,
        ]);
    }

    public function test_lecturer_can_post_for_course_they_teach(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $course = $this->createCourse();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        $response = $this->actingAs($lecturer)->postJson("/api/courses/{$course->id}/announcements", [
            'title' => 'Lecturer Update',
            'content' => 'Update from your lecturer.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Lecturer Update');
    }

    public function test_lecturer_cannot_post_for_course_they_do_not_teach(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $course = $this->createCourse();

        $response = $this->actingAs($lecturer)->postJson("/api/courses/{$course->id}/announcements", [
            'title' => 'Bad Post',
            'content' => 'Should not work.',
        ]);

        $response->assertForbidden();
    }

    public function test_student_cannot_post_announcement(): void
    {
        $course = $this->createCourse();
        $student = $this->enrollStudent($course);

        $response = $this->actingAs($student)->postJson("/api/courses/{$course->id}/announcements", [
            'title' => 'Student Post',
            'content' => 'Should not work.',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_announcement(): void
    {
        $admin = $this->admin();
        $course = $this->createCourse();
        $announcement = Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Old Title',
            'content' => 'Old content.',
        ]);

        $response = $this->actingAs($admin)->putJson("/api/courses/{$course->id}/announcements/{$announcement->id}", [
            'title' => 'New Title',
            'content' => 'New content.',
            'isPinned' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'New Title')
            ->assertJsonPath('data.content', 'New content.');
    }

    public function test_lecturer_can_toggle_announcement_active_status(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $course = $this->createCourse();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);
        $announcement = Announcement::factory()->create([
            'course_id' => $course->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($lecturer)->deleteJson("/api/courses/{$course->id}/announcements/{$announcement->id}");

        $response->assertOk()
            ->assertJsonPath('data.isActive', false);

        $this->assertDatabaseHas('announcements', [
            'id' => $announcement->id,
            'is_active' => false,
        ]);
    }

    public function test_inactive_announcements_are_not_listed(): void
    {
        $admin = $this->admin();
        $course = $this->createCourse();
        Announcement::factory()->create([
            'course_id' => $course->id,
            'title' => 'Inactive',
            'is_active' => false,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/courses/{$course->id}/announcements");

        $response->assertOk()
            ->assertJsonCount(0, 'data.announcements');
    }
}
