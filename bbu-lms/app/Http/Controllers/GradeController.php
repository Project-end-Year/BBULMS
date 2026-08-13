<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\GradeResource;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\User;
use App\Services\GradeCalculator;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class GradeController extends Controller
{
    public function __construct(private GradeCalculator $calculator) {}

    /**
     * List all grade entries for an offering (lecturer/admin gradebook).
     */
    public function index(CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('viewAny', [Grade::class, $offering]);

        $grades = Grade::query()
            ->where('course_offering_id', $offering->id)
            ->with(['student', 'component'])
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'grades' => GradeResource::collection($grades),
        ]);
    }

    /**
     * Show the current user's grade breakdown for an offering.
     */
    public function myGrades(CourseOffering $offering)
    {
        $user = $this->requireUser();
        Gate::authorize('viewOwn', [Grade::class, $offering]);

        $result = $this->calculator->recalculateAndSave($offering, $user);

        return ApiResponse::success([
            'breakdown' => $result['components'],
            'overall' => $result['overall'],
            'letterGrade' => $result['letterGrade'],
            'totalWeight' => $result['totalWeight'],
        ]);
    }

    /**
     * Show a single student's gradebook for an offering (lecturer/admin).
     */
    public function forStudent(CourseOffering $offering, User $student)
    {
        $this->requireUser();
        Gate::authorize('manage', [Grade::class, $offering]);

        $isEnrolled = $offering->enrollments()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->exists();

        if (! $isEnrolled) {
            return ApiResponse::error('Student is not enrolled in this offering.', 404);
        }

        $result = $this->calculator->recalculateAndSave($offering, $student);

        return ApiResponse::success([
            'student' => new \App\Http\Resources\ConversationUserResource($student),
            'breakdown' => $result['components'],
            'overall' => $result['overall'],
            'letterGrade' => $result['letterGrade'],
            'totalWeight' => $result['totalWeight'],
        ]);
    }

    /**
     * Recalculate and store grades for all enrolled students.
     */
    public function recalculate(CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('manage', [Grade::class, $offering]);

        $enrollments = Enrollment::query()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->get();

        foreach ($enrollments as $enrollment) {
            $this->calculator->recalculateAndSave($offering, $enrollment->student);
        }

        return ApiResponse::success(['recalculated' => $enrollments->count()], 'Grades recalculated.');
    }

    /**
     * Store or update a manual grade for a student and component.
     */
    public function storeOrUpdate(Request $request, CourseOffering $offering)
    {
        $user = $this->requireUser();
        Gate::authorize('manage', [Grade::class, $offering]);

        $validated = $request->validate([
            'studentId' => ['required', 'integer', 'exists:users,id'],
            'componentId' => ['required', 'integer', 'exists:grade_components,id'],
            'points' => ['nullable', 'numeric', 'min:0'],
            'maxPoints' => ['nullable', 'numeric', 'min:0'],
            'percentage' => ['required_without:points', 'nullable', 'numeric', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string'],
        ]);

        $component = GradeComponent::query()
            ->where('id', $validated['componentId'])
            ->where('course_offering_id', $offering->id)
            ->firstOrFail();

        if (isset($validated['points'], $validated['maxPoints']) && $validated['maxPoints'] > 0) {
            $percentage = round(($validated['points'] / $validated['maxPoints']) * 100, 2);
        } else {
            $percentage = $validated['percentage'] ?? null;
        }

        $grade = Grade::updateOrCreate(
            [
                'course_offering_id' => $offering->id,
                'student_id' => $validated['studentId'],
                'grade_component_id' => $component->id,
            ],
            [
                'points' => $validated['points'] ?? null,
                'max_points' => $validated['maxPoints'] ?? null,
                'percentage' => $percentage,
                'letter_grade' => $this->calculator->percentageToLetter($percentage),
                'feedback' => $validated['feedback'] ?? null,
            ]
        );

        $grade->load(['student', 'component']);

        NotificationService::fromGrade($grade, $offering);

        return ApiResponse::success(
            ['grade' => new GradeResource($grade)],
            'Grade saved.'
        );
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
