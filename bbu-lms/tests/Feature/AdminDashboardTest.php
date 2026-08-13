<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function createAdmin(): User
    {
        return User::factory()->create()->assignRole('admin');
    }

    public function test_guest_and_non_admin_cannot_access_admin_dashboard(): void
    {
        $this->getJson('/api/admin/dashboard')->assertStatus(401);

        $student = User::factory()->create()->assignRole('student');
        $this->actingAs($student)
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_dashboard_returns_summary_counts(): void
    {
        $admin = $this->createAdmin();
        $faculty = Faculty::factory()->create();
        $department = Department::factory()->create(['faculty_id' => $faculty->id]);
        $program = Program::factory()->create(['department_id' => $department->id]);
        $semester = Semester::factory()->create([
            'is_active' => true,
            'start_date' => now()->subDay()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d'),
        ]);
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
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.counts.users.total', 3)
            ->assertJsonPath('data.counts.users.students', 1)
            ->assertJsonPath('data.counts.users.lecturers', 1)
            ->assertJsonPath('data.counts.users.admins', 1)
            ->assertJsonPath('data.counts.courses', 1)
            ->assertJsonPath('data.counts.courseOfferings', 1)
            ->assertJsonPath('data.counts.enrollments.total', 1)
            ->assertJsonPath('data.counts.organizations.departments', 1)
            ->assertJsonPath('data.counts.organizations.programs', 1)
            ->assertJsonPath('data.counts.organizations.semesters', 1)
            ->assertJsonPath('data.systemHealth.activeSemester.id', $semester->id)
            ->assertJsonPath('data.systemHealth.activeOfferingsThisSemester', 1);

        $this->assertGreaterThanOrEqual(3, count($response->json('data.recentActivity.users')));
        $this->assertCount(1, $response->json('data.recentActivity.courses'));
        $this->assertCount(1, $response->json('data.recentActivity.enrollments'));
    }

    public function test_department_crud_requires_admin(): void
    {
        $student = User::factory()->create()->assignRole('student');
        $this->actingAs($student)
            ->getJson('/api/admin/departments')
            ->assertStatus(403);

        $admin = $this->createAdmin();
        $faculty = Faculty::factory()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/departments', [
                'facultyId' => $faculty->id,
                'code' => 'CS',
                'name' => 'Computer Science',
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'CS');

        $department = Department::where('code', 'CS')->first();
        $this->assertNotNull($department);

        $this->actingAs($admin)
            ->putJson("/api/admin/departments/{$department->id}", [
                'facultyId' => $faculty->id,
                'code' => 'CS-UPD',
                'name' => 'Updated CS',
                'isActive' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.code', 'CS-UPD');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/departments/{$department->id}")
            ->assertOk();

        $this->assertModelMissing($department);
    }

    public function test_program_crud_requires_admin(): void
    {
        $admin = $this->createAdmin();
        $department = Department::factory()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/programs', [
                'departmentId' => $department->id,
                'code' => 'SE',
                'name' => 'Software Engineering',
                'durationYears' => 4,
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'SE');

        $program = Program::where('code', 'SE')->first();

        $this->actingAs($admin)
            ->putJson("/api/admin/programs/{$program->id}", [
                'departmentId' => $department->id,
                'code' => 'SE-UPD',
                'name' => 'Updated SE',
                'durationYears' => 5,
                'isActive' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.code', 'SE-UPD');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/programs/{$program->id}")
            ->assertOk();

        $this->assertModelMissing($program);
    }

    public function test_semester_crud_requires_admin(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->postJson('/api/admin/semesters', [
                'name' => 'Fall 2026',
                'startDate' => '2026-09-01',
                'endDate' => '2026-12-15',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Fall 2026');

        $semester = Semester::where('name', 'Fall 2026')->first();

        $this->actingAs($admin)
            ->putJson("/api/admin/semesters/{$semester->id}", [
                'name' => 'Fall 2026 Updated',
                'startDate' => '2026-09-01',
                'endDate' => '2026-12-20',
                'isActive' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Fall 2026 Updated');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/semesters/{$semester->id}")
            ->assertOk();

        $this->assertModelMissing($semester);
    }

    public function test_admin_export_reports_return_spreadsheet_response(): void
    {
        $admin = $this->createAdmin();

        foreach (['users', 'courses', 'enrollments'] as $type) {
            $this->actingAs($admin)
                ->getJson("/api/admin/reports/{$type}")
                ->assertOk()
                ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
    }
}
