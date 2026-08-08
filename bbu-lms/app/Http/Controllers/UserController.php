<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\RoleResource;
use App\Http\Resources\SemesterResource;
use App\Http\Resources\UserResource;
use App\Models\Department;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * List users with optional filtering, sorting and pagination.
     */
    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'in:admin,lecturer,student'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'sortBy' => ['nullable', 'string', 'in:name,email,created_at'],
            'sortDir' => ['nullable', 'string', 'in:asc,desc'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::with(['department', 'roles', 'studentProfile.department', 'studentProfile.semester', 'lecturerProfile.department']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->role($request->input('role'));
        }

        if ($request->filled('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        $sortBy = $request->input('sortBy', 'created_at');
        $sortDir = $request->input('sortDir', 'desc');
        $allowedSortBy = ['name', 'email', 'created_at'];

        if (! in_array($sortBy, $allowedSortBy)) {
            $sortBy = 'created_at';
        }

        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('perPage', 15);

        $users = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'users' => UserResource::collection($users),
            'pagination' => [
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'perPage' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    /**
     * Show a single user with related data.
     */
    public function show(User $user)
    {
        $user->load(['department', 'roles', 'studentProfile.department', 'studentProfile.semester', 'lecturerProfile.department']);

        return ApiResponse::success([
            'user' => new UserResource($user),
            'departments' => DepartmentResource::collection(Department::where('is_active', true)->orderBy('name')->get()),
            'roles' => RoleResource::collection(Role::where('guard_name', 'web')->orderBy('name')->get()),
        ]);
    }

    /**
     * Create a new user account with roles and optional profile.
     */
    public function store(Request $request)
    {
        $validated = $this->validateUserRequest($request);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'department_id' => $validated['departmentId'] ?? null,
            'locale' => $validated['locale'] ?? 'en',
            'is_active' => $validated['isActive'] ?? true,
        ]);

        $roles = $validated['roles'] ?? [];
        if (! empty($roles)) {
            $user->syncRoles($roles);
        }

        $this->upsertProfile($user, $validated);

        $user->load(['department', 'roles', 'studentProfile.department', 'studentProfile.semester', 'lecturerProfile.department']);

        return ApiResponse::success(
            new UserResource($user),
            'User created successfully.',
            201
        );
    }

    /**
     * Update an existing user account, roles and profile.
     */
    public function update(Request $request, User $user)
    {
        $validated = $this->validateUserRequest($request, $user);

        $currentUser = Auth::user();

        if ($currentUser && $currentUser->id === $user->id) {
            $roles = $validated['roles'] ?? [];
            if (! in_array('admin', $roles)) {
                throw ValidationException::withMessages([
                    'roles' => ['You cannot remove your own admin role.'],
                ]);
            }

            if (! ($validated['isActive'] ?? true)) {
                throw ValidationException::withMessages([
                    'isActive' => ['You cannot deactivate your own account.'],
                ]);
            }
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'department_id' => $validated['departmentId'] ?? null,
            'locale' => $validated['locale'] ?? 'en',
            'is_active' => $validated['isActive'] ?? $user->is_active,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $this->upsertProfile($user, $validated);

        $user->load(['department', 'roles', 'studentProfile.department', 'studentProfile.semester', 'lecturerProfile.department']);

        return ApiResponse::success(
            new UserResource($user),
            'User updated successfully.'
        );
    }

    /**
     * Toggle a user's active status (deactivate or reactivate).
     */
    public function toggleActive(User $user)
    {
        $currentUser = Auth::user();

        if ($currentUser && $currentUser->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot deactivate your own account.'],
            ]);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return ApiResponse::success(
            new UserResource($user->load('department', 'roles')),
            "User {$status} successfully."
        );
    }

    /**
     * Update only the roles for a user.
     */
    public function updateRoles(Request $request, User $user)
    {
        $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'in:admin,lecturer,student'],
        ]);

        $roles = $request->input('roles');

        $currentUser = Auth::user();
        if ($currentUser && $currentUser->id === $user->id && ! in_array('admin', $roles)) {
            throw ValidationException::withMessages([
                'roles' => ['You cannot remove your own admin role.'],
            ]);
        }

        $user->syncRoles($roles);

        return ApiResponse::success(
            new UserResource($user->load('department', 'roles')),
            'Roles updated successfully.'
        );
    }

    /**
     * Return metadata needed to build the user form.
     */
    public function formMeta()
    {
        return ApiResponse::success([
            'departments' => DepartmentResource::collection(Department::where('is_active', true)->orderBy('name')->get()),
            'roles' => RoleResource::collection(Role::where('guard_name', 'web')->orderBy('name')->get()),
            'semesters' => SemesterResource::collection(Semester::where('is_active', true)->orderBy('start_date', 'desc')->get()),
        ]);
    }

    /**
     * Validate request data for user store/update.
     */
    private function validateUserRequest(Request $request, ?User $user = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'roles' => $user ? ['nullable', 'array'] : ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'in:admin,lecturer,student'],
            'departmentId' => ['nullable', 'exists:departments,id'],
            'locale' => ['nullable', 'string', 'in:en,km'],
            'isActive' => ['nullable', 'boolean'],
        ];

        $rules['password'] = $user === null
            ? ['required', 'string', 'min:8']
            : ['nullable', 'string', 'min:8'];

        $validated = $request->validate($rules);

        $hasRole = fn (string $role): bool => in_array($role, $validated['roles'] ?? []);

        if ($hasRole('student')) {
            $studentProfile = $request->validate([
                'studentId' => ['required', 'string', 'max:50', Rule::unique('student_profiles', 'student_id')->ignore(optional($user?->studentProfile)->id)],
                'major' => ['nullable', 'string', 'max:255'],
                'year' => ['nullable', 'integer', 'min:1', 'max:6'],
                'semesterId' => ['nullable', 'exists:semesters,id'],
            ]);

            $validated['studentId'] = $studentProfile['studentId'] ?? null;
            $validated['major'] = $studentProfile['major'] ?? null;
            $validated['year'] = $studentProfile['year'] ?? null;
            $validated['semesterId'] = $studentProfile['semesterId'] ?? null;
        }

        if ($hasRole('lecturer')) {
            $validated['title'] = $request->input('title');
            $validated['officeHours'] = $request->input('officeHours');
        }

        return $validated;
    }

    /**
     * Create or update role-specific profiles.
     */
    private function upsertProfile(User $user, array $validated): void
    {
        $roles = $validated['roles'] ?? [];

        if (in_array('student', $roles)) {
            $user->studentProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'student_id' => $validated['studentId'] ?? null,
                    'department_id' => $validated['departmentId'] ?? null,
                    'major' => $validated['major'] ?? null,
                    'year' => $validated['year'] ?? null,
                    'semester_id' => $validated['semesterId'] ?? null,
                ]
            );
        } else {
            $user->studentProfile()?->delete();
        }

        if (in_array('lecturer', $roles)) {
            $user->lecturerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $validated['departmentId'] ?? null,
                    'title' => $validated['title'] ?? null,
                    'office_hours' => $validated['officeHours'] ?? null,
                ]
            );
        } else {
            $user->lecturerProfile()?->delete();
        }
    }
}
