<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'facultyId' => ['nullable', 'integer', 'exists:faculties,id'],
            'isActive' => ['nullable', 'boolean'],
            'sortBy' => ['nullable', 'string', 'in:name,code,created_at'],
            'sortDir' => ['nullable', 'string', 'in:asc,desc'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Department::query()
            ->with('faculty')
            ->withCount(['users', 'courses', 'programs'])
            ->orderBy($validated['sortBy'] ?? 'name', $validated['sortDir'] ?? 'asc');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (! empty($validated['facultyId'])) {
            $query->where('faculty_id', $validated['facultyId']);
        }

        if (isset($validated['isActive'])) {
            $query->where('is_active', $validated['isActive']);
        }

        $perPage = $validated['perPage'] ?? 50;

        $departments = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'departments' => DepartmentResource::collection($departments),
            'pagination' => [
                'currentPage' => $departments->currentPage(),
                'lastPage' => $departments->lastPage(),
                'perPage' => $departments->perPage(),
                'total' => $departments->total(),
                'from' => $departments->firstItem(),
                'to' => $departments->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'facultyId' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'isActive' => ['boolean'],
        ]);

        $department = Department::create([
            'faculty_id' => $validated['facultyId'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        $department->load('faculty');

        return ApiResponse::success($department, null, 201);
    }

    public function show(Department $department)
    {
        $department->load(['faculty', 'programs']);
        $department->loadCount(['users', 'courses', 'programs']);

        return ApiResponse::success($department);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'facultyId' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($department->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'isActive' => ['boolean'],
        ]);

        $department->update([
            'faculty_id' => $validated['facultyId'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['isActive'] ?? $department->is_active,
        ]);

        $department->load('faculty');

        return ApiResponse::success($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return ApiResponse::success(['message' => 'Department deleted.']);
    }
}
