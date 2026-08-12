<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\Semester;
use App\Models\User;
use App\Services\GpaCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class GradeHistoryController extends Controller
{
    public function __construct(private GpaCalculator $calculator) {}

    /**
     * Return the current user's full grade history and cumulative GPA.
     */
    public function myHistory(Request $request)
    {
        $user = $this->requireUser();

        $semesterId = $request->input('semesterId');
        $summary = $this->calculator->calculateStudentGpa($user);

        $semesters = $summary['semesters'];

        if ($semesterId !== null) {
            $semesters = array_values(array_filter(
                $semesters,
                fn ($semester) => (string) $semester['semesterId'] === (string) $semesterId
            ));
        }

        return ApiResponse::success([
            'semesters' => $semesters,
            'cumulativeCredits' => $summary['cumulativeCredits'],
            'cumulativeGpa' => $summary['cumulativeGpa'],
        ]);
    }

    /**
     * Return a summary for the current semester (or a requested semester).
     */
    public function myCurrentSummary(Request $request)
    {
        $user = $this->requireUser();

        $semesterId = $request->input('semesterId');

        if ($semesterId === null) {
            $activeSemester = Semester::query()
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now())
                ->first();

            $semesterId = $activeSemester?->id;
        }

        $summary = $this->calculator->calculateStudentGpa($user);

        $semester = $semesterId !== null
            ? array_values(array_filter(
                $summary['semesters'],
                fn ($s) => (string) $s['semesterId'] === (string) $semesterId
            ))[0] ?? null
            : null;

        return ApiResponse::success([
            'semesterId' => $semester ? $semester['semesterId'] : null,
            'semesterName' => $semester ? $semester['semesterName'] : 'No active semester',
            'courses' => $semester ? $semester['courses'] : [],
            'totalCredits' => $semester ? $semester['totalCredits'] : 0,
            'gpa' => $semester ? $semester['gpa'] : null,
            'cumulativeCredits' => $summary['cumulativeCredits'],
            'cumulativeGpa' => $summary['cumulativeGpa'],
        ]);
    }

    /**
     * Admin/lecturer endpoint to view a specific student's history.
     */
    public function forStudent(Request $request, User $student)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('admin') && ! $user->hasRole('lecturer')) {
            abort(403, 'Only admins and lecturers can view student grade history.');
        }

        $semesterId = $request->input('semesterId');
        $summary = $this->calculator->calculateStudentGpa($student);

        $semesters = $summary['semesters'];

        if ($semesterId !== null) {
            $semesters = array_values(array_filter(
                $semesters,
                fn ($semester) => (string) $semester['semesterId'] === (string) $semesterId
            ));
        }

        return ApiResponse::success([
            'student' => new \App\Http\Resources\ConversationUserResource($student),
            'semesters' => $semesters,
            'cumulativeCredits' => $summary['cumulativeCredits'],
            'cumulativeGpa' => $summary['cumulativeGpa'],
        ]);
    }

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
