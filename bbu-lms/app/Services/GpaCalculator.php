<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Support\Collection;

class GpaCalculator
{
    /**
     * Standard 4.0 scale without plus/minus modifiers.
     */
    private const LETTER_TO_POINTS = [
        'A' => 4.0,
        'B' => 3.0,
        'C' => 2.0,
        'D' => 1.0,
        'F' => 0.0,
    ];

    public function __construct(private GradeCalculator $gradeCalculator) {}

    /**
     * Calculate semester and cumulative GPA for a student.
     *
     * Returns a summary keyed by semester id plus a cumulative rollup.
     */
    public function calculateStudentGpa(User $student): array
    {
        $enrollments = Enrollment::query()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->with(['courseOffering.course', 'courseOffering.semester'])
            ->get()
            ->sortBy('courseOffering.semester.start_date');

        $semesters = [];
        $cumulativeCredits = 0;
        $cumulativePoints = 0;

        foreach ($enrollments as $enrollment) {
            $offering = $enrollment->courseOffering;
            $semester = $offering->semester;
            $course = $offering->course;

            if (! $semester || ! $course) {
                continue;
            }

            $result = $this->gradeCalculator->calculateForStudent($offering, $student);
            $letterGrade = $result['letterGrade'];
            $percentage = $result['overall'];
            $gpaPoints = $this->letterToPoints($letterGrade);
            $credits = (int) $course->credits;
            $qualityPoints = $gpaPoints * $credits;

            $semesterId = $semester->id;

            if (! isset($semesters[$semesterId])) {
                $semesters[$semesterId] = [
                    'semester' => $semester,
                    'courses' => [],
                    'totalCredits' => 0,
                    'totalQualityPoints' => 0,
                ];
            }

            $semesters[$semesterId]['courses'][] = [
                'offeringId' => $offering->id,
                'courseCode' => $course->code,
                'courseName' => $course->name,
                'credits' => $credits,
                'percentage' => $percentage,
                'letterGrade' => $letterGrade,
                'gpaPoints' => $gpaPoints,
                'qualityPoints' => $qualityPoints,
            ];

            $semesters[$semesterId]['totalCredits'] += $credits;
            $semesters[$semesterId]['totalQualityPoints'] += $qualityPoints;

            $cumulativeCredits += $credits;
            $cumulativePoints += $qualityPoints;
        }

        $semesterSummaries = [];
        foreach ($semesters as $semesterId => $data) {
            $semesterSummaries[] = [
                'semesterId' => $semesterId,
                'semesterName' => $data['semester']->name,
                'startDate' => $data['semester']->start_date?->toDateString(),
                'endDate' => $data['semester']->end_date?->toDateString(),
                'courses' => $data['courses'],
                'totalCredits' => $data['totalCredits'],
                'gpa' => $this->computeGpa($data['totalQualityPoints'], $data['totalCredits']),
            ];
        }

        // Most recent semester first.
        $semesterSummaries = array_reverse($semesterSummaries);

        return [
            'semesters' => $semesterSummaries,
            'cumulativeCredits' => $cumulativeCredits,
            'cumulativeGpa' => $this->computeGpa($cumulativePoints, $cumulativeCredits),
        ];
    }

    /**
     * Calculate GPA for a single course offering based on a student's grades.
     */
    public function calculateOfferingGpa(User $student, $offering): ?array
    {
        $result = $this->gradeCalculator->calculateForStudent($offering, $student);
        $course = $offering->course;

        if (! $course) {
            return null;
        }

        $letterGrade = $result['letterGrade'];
        $credits = (int) $course->credits;
        $gpaPoints = $this->letterToPoints($letterGrade);

        return [
            'offeringId' => $offering->id,
            'courseCode' => $course->code,
            'courseName' => $course->name,
            'credits' => $credits,
            'percentage' => $result['overall'],
            'letterGrade' => $letterGrade,
            'gpaPoints' => $gpaPoints,
            'qualityPoints' => $gpaPoints * $credits,
        ];
    }

    /**
     * Map a letter grade to 4.0 scale points.
     */
    public function letterToPoints(?string $letter): ?float
    {
        if ($letter === null) {
            return null;
        }

        return self::LETTER_TO_POINTS[$letter] ?? null;
    }

    /**
     * Compute GPA from quality points and credits.
     */
    private function computeGpa(float $qualityPoints, int $credits): ?float
    {
        if ($credits <= 0) {
            return null;
        }

        return round($qualityPoints / $credits, 2);
    }
}
