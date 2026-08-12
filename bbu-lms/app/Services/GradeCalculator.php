<?php

namespace App\Services;

use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\CourseOffering;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Collection;

class GradeCalculator
{
    /**
     * Calculate the weighted overall percentage for a student in an offering.
     */
    public function calculateForStudent(CourseOffering $offering, User $student): array
    {
        $components = GradeComponent::query()
            ->where('course_offering_id', $offering->id)
            ->orderBy('order')
            ->get();

        if ($components->isEmpty()) {
            return [
                'components' => [],
                'overall' => null,
                'letterGrade' => null,
                'totalWeight' => 0,
            ];
        }

        $breakdown = [];
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($components as $component) {
            $result = $this->calculateComponent($offering, $student, $component);
            $breakdown[] = [
                'component' => $component,
                'percentage' => $result['percentage'],
                'points' => $result['points'],
                'maxPoints' => $result['maxPoints'],
                'weight' => $component->weight,
                'weighted' => $result['weighted'],
            ];

            if ($result['percentage'] !== null) {
                $weightedSum += $result['weighted'];
                $totalWeight += $component->weight;
            }
        }

        $overall = $totalWeight > 0 ? round(($weightedSum / $totalWeight) * 100, 2) : null;

        return [
            'components' => $breakdown,
            'overall' => $overall,
            'letterGrade' => $this->percentageToLetter($overall),
            'totalWeight' => $totalWeight,
        ];
    }

    /**
     * Recalculate and persist grade rows for a student in an offering.
     */
    public function recalculateAndSave(CourseOffering $offering, User $student): array
    {
        $result = $this->calculateForStudent($offering, $student);

        foreach ($result['components'] as $item) {
            $component = $item['component'];

            Grade::updateOrCreate(
                [
                    'course_offering_id' => $offering->id,
                    'student_id' => $student->id,
                    'grade_component_id' => $component->id,
                ],
                [
                    'points' => $item['points'],
                    'max_points' => $item['maxPoints'],
                    'percentage' => $item['percentage'],
                    'letter_grade' => $this->percentageToLetter($item['percentage']),
                ]
            );
        }

        return $result;
    }

    /**
     * Calculate a single component's score for a student.
     */
    public function calculateComponent(CourseOffering $offering, User $student, GradeComponent $component): array
    {
        $type = $component->type;

        return match ($type) {
            'assignment' => $this->assignmentComponent($offering, $student, $component),
            'attendance' => $this->attendanceComponent($offering, $student, $component),
            'quiz' => $this->quizComponent($offering, $student, $component),
            default => $this->manualComponent($student, $component),
        };
    }

    private function assignmentComponent(CourseOffering $offering, User $student, GradeComponent $component): array
    {
        $submissions = AssignmentSubmission::query()
            ->whereHas('assignment', function ($q) use ($offering) {
                $q->where('course_offering_id', $offering->id);
            })
            ->where('student_id', $student->id)
            ->whereNotNull('grade')
            ->get();

        if ($submissions->isEmpty()) {
            return [
                'percentage' => null,
                'points' => null,
                'maxPoints' => null,
                'weighted' => 0,
            ];
        }

        $totalEarned = 0;
        $totalMax = 0;

        foreach ($submissions as $submission) {
            $totalEarned += (float) $submission->grade;
            $totalMax += (float) $submission->assignment->max_points;
        }

        $percentage = $totalMax > 0 ? round(($totalEarned / $totalMax) * 100, 2) : 0;

        return [
            'percentage' => $percentage,
            'points' => $totalEarned,
            'maxPoints' => $totalMax,
            'weighted' => $percentage * ($component->weight / 100),
        ];
    }

    private function attendanceComponent(CourseOffering $offering, User $student, GradeComponent $component): array
    {
        $sessions = AttendanceSession::query()
            ->where('course_offering_id', $offering->id)
            ->get();

        $records = AttendanceRecord::query()
            ->whereIn('attendance_session_id', $sessions->pluck('id'))
            ->where('student_id', $student->id)
            ->whereIn('status', ['present', 'late', 'excused'])
            ->get();

        $totalSessions = $sessions->count();

        if ($totalSessions === 0) {
            return [
                'percentage' => null,
                'points' => null,
                'maxPoints' => null,
                'weighted' => 0,
            ];
        }

        $attended = $records->whereIn('status', ['present', 'late'])->count();
        $excused = $records->where('status', 'excused')->count();
        $effectiveTotal = $totalSessions - $excused;

        $percentage = $effectiveTotal > 0
            ? round(($attended / $effectiveTotal) * 100, 2)
            : 0;

        return [
            'percentage' => $percentage,
            'points' => $attended,
            'maxPoints' => $effectiveTotal,
            'weighted' => $percentage * ($component->weight / 100),
        ];
    }

    private function quizComponent(CourseOffering $offering, User $student, GradeComponent $component): array
    {
        $settings = $component->settings ?? [];
        $quizIds = $settings['quizIds'] ?? null;
        $quizTypes = $settings['quizTypes'] ?? null;

        $query = Quiz::query()
            ->where('course_offering_id', $offering->id)
            ->where('is_published', true);

        if (is_array($quizIds) && ! empty($quizIds)) {
            $query->whereIn('id', $quizIds);
        }

        if (is_array($quizTypes) && ! empty($quizTypes)) {
            $query->whereIn('type', $quizTypes);
        }

        $quizIds = $query->pluck('id');

        if ($quizIds->isEmpty()) {
            return [
                'percentage' => null,
                'points' => null,
                'maxPoints' => null,
                'weighted' => 0,
            ];
        }

        $attempts = QuizAttempt::query()
            ->whereIn('quiz_id', $quizIds)
            ->where('student_id', $student->id)
            ->where('status', 'completed')
            ->whereNotNull('percentage')
            ->get();

        if ($attempts->isEmpty()) {
            return [
                'percentage' => null,
                'points' => null,
                'maxPoints' => null,
                'weighted' => 0,
            ];
        }

        $percentages = $attempts->pluck('percentage')->map(fn ($p) => (float) $p);
        $percentage = round($percentages->avg(), 2);

        return [
            'percentage' => $percentage,
            'points' => $percentage,
            'maxPoints' => 100,
            'weighted' => $percentage * ($component->weight / 100),
        ];
    }

    private function manualComponent(User $student, GradeComponent $component): array
    {
        $grade = Grade::query()
            ->where('student_id', $student->id)
            ->where('grade_component_id', $component->id)
            ->first();

        if (! $grade || $grade->percentage === null) {
            return [
                'percentage' => null,
                'points' => null,
                'maxPoints' => null,
                'weighted' => 0,
            ];
        }

        return [
            'percentage' => (float) $grade->percentage,
            'points' => $grade->points !== null ? (float) $grade->points : null,
            'maxPoints' => $grade->max_points !== null ? (float) $grade->max_points : null,
            'weighted' => ((float) $grade->percentage) * ($component->weight / 100),
        ];
    }

    public function percentageToLetter(?float $percentage): ?string
    {
        if ($percentage === null) {
            return null;
        }

        return match (true) {
            $percentage >= 90 => 'A',
            $percentage >= 80 => 'B',
            $percentage >= 70 => 'C',
            $percentage >= 60 => 'D',
            default => 'F',
        };
    }
}
