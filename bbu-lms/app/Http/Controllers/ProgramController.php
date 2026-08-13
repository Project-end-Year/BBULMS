<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'isActive' => ['nullable', 'boolean'],
            'sortBy' => ['nullable', 'string', 'in:name,code,created_at'],
            'sortDir' => ['nullable', 'string', 'in:asc,desc'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Program::query()
            ->with('department')
            ->withCount('courses')
            ->orderBy($validated['sortBy'] ?? 'name', $validated['sortDir'] ?? 'asc');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (! empty($validated['departmentId'])) {
            $query->where('department_id', $validated['departmentId']);
        }

        if (isset($validated['isActive'])) {
            $query->where('is_active', $validated['isActive']);
        }

        $perPage = $validated['perPage'] ?? 50;

        $programs = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'programs' => ProgramResource::collection($programs),
            'pagination' => [
                'currentPage' => $programs->currentPage(),
                'lastPage' => $programs->lastPage(),
                'perPage' => $programs->perPage(),
                'total' => $programs->total(),
                'from' => $programs->firstItem(),
                'to' => $programs->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'departmentId' => ['required', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', 'unique:programs,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'durationYears' => ['nullable', 'integer', 'min:1', 'max:10'],
            'isActive' => ['boolean'],
        ]);

        $program = Program::create([
            'department_id' => $validated['departmentId'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'duration_years' => $validated['durationYears'] ?? 4,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        $program->load('department');

        return ApiResponse::success($program, null, 201);
    }

    public function show(Program $program)
    {
        $program->load('department');
        $program->loadCount('courses');

        return ApiResponse::success($program);
    }

    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'departmentId' => ['required', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', Rule::unique('programs', 'code')->ignore($program->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'durationYears' => ['nullable', 'integer', 'min:1', 'max:10'],
            'isActive' => ['boolean'],
        ]);

        $program->update([
            'department_id' => $validated['departmentId'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'duration_years' => $validated['durationYears'] ?? $program->duration_years,
            'is_active' => $validated['isActive'] ?? $program->is_active,
        ]);

        $program->load('department');

        return ApiResponse::success($program);
    }

    public function destroy(Program $program)
    {
        $program->delete();

        return ApiResponse::success(['message' => 'Program deleted.']);
    }
}
