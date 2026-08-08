<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
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

    public function test_admin_can_list_users(): void
    {
        $admin = $this->admin();
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/users');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'users',
                    'pagination' => ['currentPage', 'lastPage', 'perPage', 'total'],
                ],
            ]);
    }

    public function test_non_admin_cannot_access_user_list(): void
    {
        $student = User::factory()->create();
        $student->syncRoles(['student']);

        $response = $this->actingAs($student)->getJson('/api/admin/users');

        $response->assertForbidden();
    }

    public function test_admin_can_create_student_user(): void
    {
        $admin = $this->admin();
        $department = Department::create(['code' => 'CSE', 'name' => 'Computer Science', 'is_active' => true]);
        $semester = Semester::create([
            'name' => 'Fall 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-15',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'name' => 'Jane Student',
            'email' => 'jane@bbu.edu',
            'password' => 'secure-password',
            'roles' => ['student'],
            'departmentId' => $department->id,
            'studentId' => 'S12345',
            'major' => 'Computer Science',
            'year' => 2,
            'semesterId' => $semester->id,
            'locale' => 'en',
            'isActive' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Jane Student');

        $this->assertDatabaseHas('users', [
            'email' => 'jane@bbu.edu',
            'department_id' => $department->id,
        ]);

        $this->assertDatabaseHas('student_profiles', [
            'student_id' => 'S12345',
            'major' => 'Computer Science',
            'year' => 2,
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $user->syncRoles(['student']);

        $response = $this->actingAs($admin)->putJson("/api/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'updated@bbu.edu',
            'roles' => ['lecturer'],
            'title' => 'Professor',
            'locale' => 'en',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.email', 'updated@bbu.edu');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@bbu.edu',
        ]);
    }

    public function test_admin_can_toggle_user_active_status(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['is_active' => true]);
        $user->syncRoles(['student']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$user->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.isActive', false);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => false]);
    }

    public function test_admin_can_update_user_roles(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $user->syncRoles(['student']);

        $response = $this->actingAs($admin)->putJson("/api/admin/users/{$user->id}/roles", [
            'roles' => ['admin', 'lecturer'],
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('lecturer'));
    }

    public function test_admin_cannot_remove_own_admin_role(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}/roles", [
            'roles' => ['student'],
        ]);

        $response->assertUnprocessable();
    }

    public function test_admin_cannot_deactivate_own_account(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}");

        $response->assertUnprocessable();
    }

    public function test_list_users_supports_search_and_role_filter(): void
    {
        $admin = $this->admin();
        $student = User::factory()->create(['name' => 'Alice Student']);
        $student->syncRoles(['student']);
        $lecturer = User::factory()->create(['name' => 'Bob Lecturer']);
        $lecturer->syncRoles(['lecturer']);

        $response = $this->actingAs($admin)->getJson('/api/admin/users?role=student');

        $response->assertOk()
            ->assertJsonCount(1, 'data.users')
            ->assertJsonPath('data.users.0.name', 'Alice Student');
    }
}
