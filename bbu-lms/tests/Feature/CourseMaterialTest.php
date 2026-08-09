<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\CourseMaterialView;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourseMaterialTest extends TestCase
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

    private function createOffering(?User $lecturer = null): CourseOffering
    {
        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);

        return CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer?->id,
        ]);
    }

    public function test_admin_can_list_materials(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Admin Visible',
            'is_published' => true,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.materials')
            ->assertJsonPath('data.materials.0.title', 'Admin Visible');
    }

    public function test_lecturer_can_list_materials_for_own_offering(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);

        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Lecture Notes',
            'is_published' => true,
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.materials')
            ->assertJsonPath('data.materials.0.title', 'Lecture Notes');
    }

    public function test_student_can_list_published_materials_for_enrolled_course(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Published Material',
            'is_published' => true,
        ]);
        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Draft Material',
            'is_published' => false,
        ]);

        $response = $this->actingAs($student)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertOk()
            ->assertJsonCount(1, 'data.materials')
            ->assertJsonPath('data.materials.0.title', 'Published Material');
    }

    public function test_manager_can_see_unpublished_draft_materials(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);

        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Draft',
            'is_published' => false,
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertOk()
            ->assertJsonCount(1, 'data.materials')
            ->assertJsonPath('data.materials.0.title', 'Draft');
    }

    public function test_unrelated_user_cannot_list_materials(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();

        $response = $this->actingAs($student)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertForbidden();
    }

    public function test_guest_cannot_list_materials(): void
    {
        $offering = $this->createOffering();

        $response = $this->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertUnauthorized();
    }

    public function test_admin_can_upload_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $offering = $this->createOffering();

        $file = UploadedFile::fake()->create('slides.pdf', 100, 'application/pdf');

        $response = $this->actingAs($admin)->postJson("/api/course-offerings/{$offering->id}/materials", [
            'title' => 'Slides',
            'description' => 'Week 1 slides',
            'type' => 'file',
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Slides')
            ->assertJsonPath('data.type', 'file');

        $this->assertDatabaseHas('course_materials', [
            'course_offering_id' => $offering->id,
            'title' => 'Slides',
            'type' => 'file',
        ]);

        $material = CourseMaterial::latest()->first();
        Storage::disk('public')->assertExists($material->file_path);
    }

    public function test_lecturer_can_upload_for_own_offering(): void
    {
        Storage::fake('public');
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);

        $response = $this->actingAs($lecturer)->postJson("/api/course-offerings/{$offering->id}/materials", [
            'title' => 'Lecture Link',
            'type' => 'link',
            'externalUrl' => 'https://example.com/lecture',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Lecture Link')
            ->assertJsonPath('data.type', 'link');
    }

    public function test_lecturer_cannot_upload_for_other_offering(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $otherLecturer = User::factory()->create();
        $otherLecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($otherLecturer);

        $response = $this->actingAs($lecturer)->postJson("/api/course-offerings/{$offering->id}/materials", [
            'title' => 'Bad Upload',
            'type' => 'link',
            'externalUrl' => 'https://example.com',
        ]);

        $response->assertForbidden();
    }

    public function test_student_cannot_upload_material(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->postJson("/api/course-offerings/{$offering->id}/materials", [
            'title' => 'Student Upload',
            'type' => 'link',
            'externalUrl' => 'https://example.com',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_material(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        $material = CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Old Title',
            'type' => 'link',
            'external_url' => 'https://old.example.com',
        ]);

        $response = $this->actingAs($admin)->putJson("/api/course-offerings/{$offering->id}/materials/{$material->id}", [
            'title' => 'New Title',
            'externalUrl' => 'https://new.example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'New Title')
            ->assertJsonPath('data.externalUrl', 'https://new.example.com');
    }

    public function test_lecturer_can_toggle_material_active_status(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);
        $material = CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($lecturer)->deleteJson("/api/course-offerings/{$offering->id}/materials/{$material->id}");

        $response->assertOk()
            ->assertJsonPath('data.isActive', false);

        $this->assertDatabaseHas('course_materials', [
            'id' => $material->id,
            'is_active' => false,
        ]);
    }

    public function test_download_tracks_action_for_student(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $upload = $this->actingAs($admin)->postJson("/api/course-offerings/{$offering->id}/materials", [
            'title' => 'Doc',
            'type' => 'file',
            'file' => $file,
        ]);

        $materialId = $upload->json('data.id');

        $response = $this->actingAs($student)->getJson("/api/course-materials/{$materialId}/download");

        $response->assertOk();

        $this->assertDatabaseHas('course_material_views', [
            'course_material_id' => $materialId,
            'student_id' => $student->id,
            'action' => 'download',
        ]);
    }

    public function test_view_tracks_action_for_student(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $material = CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'type' => 'link',
            'external_url' => 'https://example.com',
        ]);

        $response = $this->actingAs($student)->postJson("/api/course-materials/{$material->id}/track-view");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('course_material_views', [
            'course_material_id' => $material->id,
            'student_id' => $student->id,
            'action' => 'view',
        ]);
    }

    public function test_manager_can_view_tracking_summary(): void
    {
        $lecturer = User::factory()->create();
        $lecturer->syncRoles(['lecturer']);
        $offering = $this->createOffering($lecturer);
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $material = CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
        ]);
        CourseMaterialView::factory()->create([
            'course_material_id' => $material->id,
            'student_id' => $student->id,
            'action' => 'view',
        ]);

        $response = $this->actingAs($lecturer)->getJson("/api/course-offerings/{$offering->id}/materials/tracking");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.tracking')
            ->assertJsonPath('data.tracking.0.action', 'view');
    }

    public function test_student_cannot_view_tracking_summary(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);
        $offering = $this->createOffering();
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->getJson("/api/course-offerings/{$offering->id}/materials/tracking");

        $response->assertForbidden();
    }

    public function test_inactive_materials_are_not_listed(): void
    {
        $admin = $this->admin();
        $offering = $this->createOffering();
        CourseMaterial::factory()->create([
            'course_offering_id' => $offering->id,
            'title' => 'Inactive',
            'is_active' => false,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/course-offerings/{$offering->id}/materials");

        $response->assertOk()
            ->assertJsonCount(0, 'data.materials');
    }
}
