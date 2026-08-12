<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\AssignmentResource;
use App\Models\Assignment;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class AssignmentController extends Controller
{
    /**
     * List assignments for a course offering.
     */
    public function index(CourseOffering $offering)
    {
        $user = $this->requireUser();

        $query = Assignment::query()
            ->where('course_offering_id', $offering->id)
            ->withCount('submissions')
            ->orderByDesc('created_at');

        if ($user->hasRole('admin')) {
            // Admins see all assignments.
        } elseif ($user->hasRole('lecturer') && $offering->lecturer_id === $user->id) {
            // Lecturer sees all their assignments.
        } else {
            $query->where('is_published', true);
        }

        $assignments = $query->get();

        return ApiResponse::success([
            'assignments' => AssignmentResource::collection($assignments),
        ]);
    }

    /**
     * Store a new assignment for a course offering.
     */
    public function store(Request $request, CourseOffering $offering)
    {
        $user = $this->requireUser();
        Gate::authorize('create', [Assignment::class, $offering]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'dueAt' => ['required', 'date'],
            'maxPoints' => ['nullable', 'numeric', 'min:0'],
            'allowedAttempts' => ['nullable', 'integer', 'min:1'],
            'allowedFileTypes' => ['nullable', 'array'],
            'allowedFileTypes.*' => ['string'],
            'maxFileSizeMb' => ['nullable', 'integer', 'min:1'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $assignment = Assignment::create([
            'course_offering_id' => $offering->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'due_at' => $validated['dueAt'],
            'max_points' => $validated['maxPoints'] ?? 100,
            'allowed_attempts' => $validated['allowedAttempts'] ?? 1,
            'allowed_file_types' => $validated['allowedFileTypes'] ?? null,
            'max_file_size_mb' => $validated['maxFileSizeMb'] ?? 10,
            'is_published' => $validated['isPublished'] ?? true,
        ]);

        $assignment->load(['courseOffering', 'creator']);

        return ApiResponse::success(
            ['assignment' => new AssignmentResource($assignment)],
            'Assignment created.',
            201
        );
    }

    /**
     * Show a single assignment.
     */
    public function show(CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('view', $assignment);

        $assignment->load(['courseOffering', 'creator', 'submissions.student']);

        return ApiResponse::success([
            'assignment' => new AssignmentResource($assignment),
        ]);
    }

    /**
     * Update an assignment.
     */
    public function update(Request $request, CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('update', $assignment);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'dueAt' => ['required', 'date'],
            'maxPoints' => ['nullable', 'numeric', 'min:0'],
            'allowedAttempts' => ['nullable', 'integer', 'min:1'],
            'allowedFileTypes' => ['nullable', 'array'],
            'allowedFileTypes.*' => ['string'],
            'maxFileSizeMb' => ['nullable', 'integer', 'min:1'],
            'isPublished' => ['nullable', 'boolean'],
        ]);

        $assignment->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'due_at' => $validated['dueAt'],
            'max_points' => $validated['maxPoints'] ?? $assignment->max_points,
            'allowed_attempts' => $validated['allowedAttempts'] ?? $assignment->allowed_attempts,
            'allowed_file_types' => $validated['allowedFileTypes'] ?? $assignment->allowed_file_types,
            'max_file_size_mb' => $validated['maxFileSizeMb'] ?? $assignment->max_file_size_mb,
            'is_published' => $validated['isPublished'] ?? $assignment->is_published,
        ]);

        $assignment->load(['courseOffering', 'creator']);

        return ApiResponse::success(
            ['assignment' => new AssignmentResource($assignment)],
            'Assignment updated.'
        );
    }

    /**
     * Delete an assignment.
     */
    public function destroy(CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('delete', $assignment);

        $assignment->delete();

        return ApiResponse::success(['deleted' => true], 'Assignment deleted.');
    }

    /**
     * Require an authenticated user.
     */
    private function requireUser(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        return $user;
    }
}
