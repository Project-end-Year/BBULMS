<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\AssignmentSubmissionResource;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AssignmentSubmissionController extends Controller
{
    /**
     * List submissions for an assignment.
     */
    public function index(CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('viewAny', [AssignmentSubmission::class, $assignment]);

        $submissions = AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->with(['student', 'grader'])
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'submissions' => AssignmentSubmissionResource::collection($submissions),
        ]);
    }

    /**
     * Get the current user's submission for an assignment.
     */
    public function mySubmission(CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('view', $assignment);

        $submission = AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('student_id', $user->id)
            ->orderByDesc('attempt_number')
            ->first();

        return ApiResponse::success([
            'submission' => $submission ? new AssignmentSubmissionResource($submission->load(['student', 'grader'])) : null,
        ]);
    }

    /**
     * Store a new submission for an assignment.
     */
    public function store(Request $request, CourseOffering $offering, Assignment $assignment)
    {
        $user = $this->requireUser();
        Gate::authorize('submit', $assignment);

        $validated = $request->validate([
            'submissionText' => ['nullable', 'string'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'mimes:pdf,doc,docx,txt,zip,jpg,jpeg,png', 'max:10240'],
        ]);

        $attemptCount = AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('student_id', $user->id)
            ->count();

        if ($attemptCount >= $assignment->allowed_attempts) {
            return ApiResponse::error('Maximum number of attempts reached.', 403);
        }

        $files = [];
        if ($request->hasFile('files')) {
            $files = $this->storeFiles($assignment, $user, $request->file('files'));
        }

        $isLate = now() > $assignment->due_at;

        $submission = AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $user->id,
            'attempt_number' => $attemptCount + 1,
            'submission_text' => $validated['submissionText'] ?? null,
            'files' => empty($files) ? null : $files,
            'submitted_at' => now(),
            'status' => $isLate ? 'late' : 'submitted',
        ]);

        $submission->load(['student', 'grader']);

        return ApiResponse::success(
            ['submission' => new AssignmentSubmissionResource($submission)],
            'Submission received.',
            201
        );
    }

    /**
     * Grade a submission.
     */
    public function grade(Request $request, CourseOffering $offering, Assignment $assignment, AssignmentSubmission $submission)
    {
        $user = $this->requireUser();
        Gate::authorize('grade', $submission);

        if ($submission->assignment_id !== $assignment->id) {
            abort(404);
        }

        $validated = $request->validate([
            'grade' => ['required', 'numeric', 'min:0', "max:{$assignment->max_points}"],
            'feedback' => ['nullable', 'string'],
        ]);

        $submission->update([
            'grade' => $validated['grade'],
            'feedback' => $validated['feedback'] ?? null,
            'graded_by' => $user->id,
            'graded_at' => now(),
            'status' => 'graded',
        ]);

        $submission->load(['student', 'grader']);

        return ApiResponse::success(
            ['submission' => new AssignmentSubmissionResource($submission)],
            'Submission graded.'
        );
    }

    /**
     * Store uploaded files for a submission.
     *
     * @param  array<int, \Illuminate\Http\UploadedFile>  $uploadedFiles
     * @return array<int, array{fileName: string, originalName: string, path: string, mimeType: string, size: int}>
     */
    private function storeFiles(Assignment $assignment, User $user, array $uploadedFiles): array
    {
        $stored = [];
        $disk = Storage::disk('local');

        foreach ($uploadedFiles as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = uniqid().'.'.($extension ?: 'bin');
            $path = "assignments/{$assignment->id}/{$user->id}/{$fileName}";

            $disk->putFileAs(dirname($path), $file, basename($path));

            $stored[] = [
                'fileName' => $fileName,
                'originalName' => $originalName,
                'path' => $path,
                'mimeType' => $file->getMimeType() ?? 'application/octet-stream',
                'size' => $file->getSize(),
            ];
        }

        return $stored;
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
