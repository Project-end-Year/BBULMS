<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\SemesterResource;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'isActive' => ['nullable', 'boolean'],
            'sortBy' => ['nullable', 'string', 'in:name,start_date,created_at'],
            'sortDir' => ['nullable', 'string', 'in:asc,desc'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Semester::query()
            ->withCount('courseOfferings')
            ->orderBy($validated['sortBy'] ?? 'start_date', $validated['sortDir'] ?? 'desc');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        if (isset($validated['isActive'])) {
            $query->where('is_active', $validated['isActive']);
        }

        $perPage = $validated['perPage'] ?? 50;

        $semesters = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'semesters' => SemesterResource::collection($semesters),
            'pagination' => [
                'currentPage' => $semesters->currentPage(),
                'lastPage' => $semesters->lastPage(),
                'perPage' => $semesters->perPage(),
                'total' => $semesters->total(),
                'from' => $semesters->firstItem(),
                'to' => $semesters->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:semesters,name'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
            'isActive' => ['boolean'],
        ]);

        $semester = Semester::create([
            'name' => $validated['name'],
            'start_date' => $validated['startDate'],
            'end_date' => $validated['endDate'],
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return ApiResponse::success($semester, null, 201);
    }

    public function show(Semester $semester)
    {
        $semester->loadCount('courseOfferings');

        return ApiResponse::success($semester);
    }

    public function update(Request $request, Semester $semester)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('semesters', 'name')->ignore($semester->id)],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
            'isActive' => ['boolean'],
        ]);

        $semester->update([
            'name' => $validated['name'],
            'start_date' => $validated['startDate'],
            'end_date' => $validated['endDate'],
            'is_active' => $validated['isActive'] ?? $semester->is_active,
        ]);

        return ApiResponse::success($semester);
    }

    public function destroy(Semester $semester)
    {
        $semester->delete();

        return ApiResponse::success(['message' => 'Semester deleted.']);
    }
}
