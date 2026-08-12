<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\CalendarEvent;
use App\Models\ClassSchedule;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class CalendarAggregationService
{
    /**
     * Build a flat, unified list of calendar items for a user across a date range.
     *
     * Combines manual calendar_events with derived items from class_schedules,
     * assignment due dates, and published exam quizzes.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function forUser(User $user, string $start, string $end): Collection
    {
        $rangeStart = Carbon::parse($start)->startOfDay();
        $rangeEnd = Carbon::parse($end)->endOfDay();

        $items = new Collection;

        $this->addCalendarEvents($items, $user, $rangeStart, $rangeEnd);
        $this->addClassScheduleItems($items, $user, $rangeStart, $rangeEnd);
        $this->addAssignmentItems($items, $user, $rangeStart, $rangeEnd);
        $this->addExamQuizItems($items, $user, $rangeStart, $rangeEnd);

        return $items
            ->sortBy('startAt')
            ->values();
    }

    /**
     * Add manual calendar_events visible to the user.
     *
     * @param Collection<int, array<string, mixed>> $items
     */
    private function addCalendarEvents(Collection $items, User $user, Carbon $rangeStart, Carbon $rangeEnd): void
    {
        $query = CalendarEvent::query()
            ->with(['creator', 'course', 'courseOffering'])
            ->where(function ($q) use ($rangeStart, $rangeEnd) {
                $q->whereBetween('start_at', [$rangeStart, $rangeEnd])
                    ->orWhereBetween('end_at', [$rangeStart, $rangeEnd])
                    ->orWhere(function ($inner) use ($rangeStart, $rangeEnd) {
                        $inner->where('start_at', '<=', $rangeStart)
                            ->where('end_at', '>=', $rangeEnd);
                    });
            });

        $this->scopeToVisibleOfferings($query, $user);

        foreach ($query->get() as $event) {
            $items->push($this->serializeCalendarEvent($event));
        }
    }

    /**
     * Expand recurring class_schedules into one item per occurrence in the range.
     *
     * @param Collection<int, array<string, mixed>> $items
     */
    private function addClassScheduleItems(Collection $items, User $user, Carbon $rangeStart, Carbon $rangeEnd): void
    {
        $offeringIds = $this->visibleOfferingIds($user);

        if ($offeringIds->isEmpty()) {
            return;
        }

        $dayMap = ['Sun' => 0, 'Mon' => 1, 'Tue' => 2, 'Wed' => 3, 'Thu' => 4, 'Fri' => 5, 'Sat' => 6];

        ClassSchedule::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('is_active', true)
            ->with(['courseOffering.course'])
            ->chunkById(200, function ($schedules) use ($items, $rangeStart, $rangeEnd, $dayMap) {
                foreach ($schedules as $schedule) {
                    $dayOfWeek = $dayMap[$schedule->day_of_week] ?? null;

                    if ($dayOfWeek === null) {
                        continue;
                    }

                    $period = CarbonPeriod::create($rangeStart, $rangeEnd);

                    foreach ($period as $date) {
                        /** @var Carbon $date */
                        if ($date->dayOfWeek !== $dayOfWeek) {
                            continue;
                        }

                        $startAt = Carbon::parse($date->toDateString().' '.$schedule->start_time);
                        $endAt = $schedule->end_time
                            ? Carbon::parse($date->toDateString().' '.$schedule->end_time)
                            : null;

                        $offering = $schedule->courseOffering;
                        $course = $offering?->course;

                        $items->push([
                            'id' => "class-schedule-{$schedule->id}-{$date->format('Y-m-d')}",
                            'title' => $course ? "{$course->name} Class" : 'Class',
                            'description' => "Scheduled class session for {$course?->name}.",
                            'type' => 'class',
                            'startAt' => $startAt->toDateTimeString(),
                            'endAt' => $endAt?->toDateTimeString(),
                            'location' => $schedule->room,
                            'isAllDay' => false,
                            'color' => '#3b82f6',
                            'courseId' => $course?->id,
                            'courseOfferingId' => $offering?->id,
                            'sourceType' => 'class_schedule',
                            'sourceId' => $schedule->id,
                            'course' => $course ? [
                                'id' => $course->id,
                                'code' => $course->code,
                                'name' => $course->name,
                            ] : null,
                            'courseOffering' => $offering ? [
                                'id' => $offering->id,
                                'section' => $offering->section,
                            ] : null,
                            'createdBy' => $offering?->lecturer_id,
                            'createdAt' => $schedule->created_at?->toDateTimeString(),
                            'updatedAt' => $schedule->updated_at?->toDateTimeString(),
                        ]);
                    }
                }
            });
    }

    /**
     * Add published assignment due dates.
     *
     * @param Collection<int, array<string, mixed>> $items
     */
    private function addAssignmentItems(Collection $items, User $user, Carbon $rangeStart, Carbon $rangeEnd): void
    {
        $offeringIds = $this->visibleOfferingIds($user);

        if ($offeringIds->isEmpty()) {
            return;
        }

        Assignment::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('is_published', true)
            ->whereBetween('due_at', [$rangeStart, $rangeEnd])
            ->with(['courseOffering.course'])
            ->chunkById(200, function ($assignments) use ($items) {
                foreach ($assignments as $assignment) {
                    $offering = $assignment->courseOffering;
                    $course = $offering?->course;

                    $items->push([
                        'id' => "assignment-{$assignment->id}",
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'type' => 'assignment',
                        'startAt' => $assignment->due_at->toDateTimeString(),
                        'endAt' => null,
                        'location' => null,
                        'isAllDay' => true,
                        'color' => '#f59e0b',
                        'courseId' => $course?->id,
                        'courseOfferingId' => $offering?->id,
                        'sourceType' => 'assignment',
                        'sourceId' => $assignment->id,
                        'course' => $course ? [
                            'id' => $course->id,
                            'code' => $course->code,
                            'name' => $course->name,
                        ] : null,
                        'courseOffering' => $offering ? [
                            'id' => $offering->id,
                            'section' => $offering->section,
                        ] : null,
                        'createdBy' => $assignment->created_by,
                        'createdAt' => $assignment->created_at?->toDateTimeString(),
                        'updatedAt' => $assignment->updated_at?->toDateTimeString(),
                    ]);
                }
            });
    }

    /**
     * Add published exam quizzes. These are normally synced into calendar_events,
     * but we also emit them directly so the aggregation stays consistent even if
     * a sync row is missing.
     *
     * @param Collection<int, array<string, mixed>> $items
     */
    private function addExamQuizItems(Collection $items, User $user, Carbon $rangeStart, Carbon $rangeEnd): void
    {
        $offeringIds = $this->visibleOfferingIds($user);

        if ($offeringIds->isEmpty()) {
            return;
        }

        Quiz::query()
            ->whereIn('course_offering_id', $offeringIds)
            ->where('type', 'exam')
            ->where('is_published', true)
            ->whereBetween('starts_at', [$rangeStart, $rangeEnd])
            ->with(['courseOffering.course'])
            ->chunkById(200, function ($quizzes) use ($items) {
                foreach ($quizzes as $quiz) {
                    $offering = $quiz->courseOffering;
                    $course = $offering?->course;

                    $items->push([
                        'id' => "quiz-{$quiz->id}",
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'type' => 'exam',
                        'startAt' => $quiz->starts_at->toDateTimeString(),
                        'endAt' => $quiz->ends_at?->toDateTimeString(),
                        'location' => null,
                        'isAllDay' => false,
                        'color' => '#ef4444',
                        'courseId' => $course?->id,
                        'courseOfferingId' => $offering?->id,
                        'sourceType' => 'quiz',
                        'sourceId' => $quiz->id,
                        'course' => $course ? [
                            'id' => $course->id,
                            'code' => $course->code,
                            'name' => $course->name,
                        ] : null,
                        'courseOffering' => $offering ? [
                            'id' => $offering->id,
                            'section' => $offering->section,
                        ] : null,
                        'createdBy' => $quiz->created_by,
                        'createdAt' => $quiz->created_at?->toDateTimeString(),
                        'updatedAt' => $quiz->updated_at?->toDateTimeString(),
                    ]);
                }
            });
    }

    /**
     * Scope a CalendarEvent query to items visible to the user.
     */
    private function scopeToVisibleOfferings($query, User $user): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('lecturer')) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereHas('courseOffering', function ($offering) use ($user) {
                        $offering->where('lecturer_id', $user->id);
                    });
            });

            return;
        }

        $enrolledOfferingIds = $this->visibleOfferingIds($user);

        $query->where(function ($q) use ($enrolledOfferingIds, $user) {
            $q->where('created_by', $user->id)
                ->orWhereNull('course_offering_id')
                ->orWhereIn('course_offering_id', $enrolledOfferingIds);
        });
    }

    /**
     * Get course offering IDs visible to the user.
     *
     * @return Collection<int, int>
     */
    private function visibleOfferingIds(User $user): Collection
    {
        if ($user->hasRole('admin')) {
            return CourseOffering::query()->pluck('id');
        }

        if ($user->hasRole('lecturer')) {
            return CourseOffering::query()
                ->where('lecturer_id', $user->id)
                ->orWhereHas('enrollments', function ($enrollment) use ($user) {
                    // Edge case: lecturers may also be enrolled as students.
                    $enrollment->where('student_id', $user->id)->where('status', 'enrolled');
                })
                ->pluck('id');
        }

        return Enrollment::query()
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->pluck('course_offering_id');
    }

    /**
     * Serialize a CalendarEvent model into the flat item shape.
     *
     * @return array<string, mixed>
     */
    private function serializeCalendarEvent(CalendarEvent $event): array
    {
        $offering = $event->courseOffering;
        $course = $event->course;

        return [
            'id' => "event-{$event->id}",
            'title' => $event->title,
            'description' => $event->description,
            'type' => $event->type,
            'startAt' => $event->start_at->toDateTimeString(),
            'endAt' => $event->end_at?->toDateTimeString(),
            'location' => $event->location,
            'isAllDay' => $event->is_all_day,
            'color' => $event->color,
            'courseId' => $event->course_id,
            'courseOfferingId' => $event->course_offering_id,
            'sourceType' => $event->source_type,
            'sourceId' => $event->source_id,
            'course' => $course ? [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
            ] : null,
            'courseOffering' => $offering ? [
                'id' => $offering->id,
                'section' => $offering->section,
            ] : null,
            'createdBy' => $event->created_by,
            'createdAt' => $event->created_at->toDateTimeString(),
            'updatedAt' => $event->updated_at->toDateTimeString(),
        ];
    }
}
