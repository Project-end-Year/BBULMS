<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CalendarEventController extends Controller
{
    /**
     * List calendar events visible to the authenticated user within a date range.
     */
    public function index(Request $request)
    {
        $user = $this->requireUser();

        $validated = $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after_or_equal:start'],
        ]);

        $start = $validated['start'];
        $end = $validated['end'];

        $query = CalendarEvent::query()
            ->with(['creator', 'course', 'courseOffering'])
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_at', [$start, $end])
                    ->orWhereBetween('end_at', [$start, $end])
                    ->orWhere(function ($inner) use ($start, $end) {
                        $inner->where('start_at', '<=', $start)
                            ->where('end_at', '>=', $end);
                    });
            });

        if ($user->hasRole('admin')) {
            // Admins see all events.
        } elseif ($user->hasRole('lecturer')) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereHas('courseOffering', function ($offering) use ($user) {
                        $offering->where('lecturer_id', $user->id);
                    });
            });
        } else {
            $enrolledOfferingIds = Enrollment::query()
                ->where('student_id', $user->id)
                ->where('status', 'enrolled')
                ->pluck('course_offering_id');

            $query->where(function ($q) use ($enrolledOfferingIds, $user) {
                $q->where('created_by', $user->id)
                    ->orWhereNull('course_offering_id')
                    ->orWhereIn('course_offering_id', $enrolledOfferingIds);
            });
        }

        $events = $query->orderBy('start_at')->get();

        return ApiResponse::success([
            'events' => CalendarEventResource::collection($events),
        ]);
    }

    /**
     * Store a new calendar event.
     */
    public function store(Request $request)
    {
        $user = $this->requireUser();
        Gate::authorize('create', CalendarEvent::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', 'string', 'in:class,assignment,quiz,exam,event'],
            'startAt' => ['required', 'date'],
            'endAt' => ['nullable', 'date', 'after_or_equal:startAt'],
            'location' => ['nullable', 'string', 'max:255'],
            'isAllDay' => ['boolean'],
            'color' => ['nullable', 'string', 'max:7'],
            'courseId' => ['nullable', 'integer', 'exists:courses,id'],
            'courseOfferingId' => ['nullable', 'integer', 'exists:course_offerings,id'],
        ]);

        if (! empty($validated['courseOfferingId'])) {
            $offering = CourseOffering::findOrFail($validated['courseOfferingId']);
            if (! $user->hasRole('admin') && $offering->lecturer_id !== $user->id) {
                return ApiResponse::error('You can only create events for your own offerings.', 403);
            }
        }

        $event = CalendarEvent::create([
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'start_at' => $validated['startAt'],
            'end_at' => $validated['endAt'] ?? null,
            'location' => $validated['location'] ?? null,
            'is_all_day' => $validated['isAllDay'] ?? false,
            'color' => $validated['color'] ?? null,
            'course_id' => $validated['courseId'] ?? null,
            'course_offering_id' => $validated['courseOfferingId'] ?? null,
        ]);

        $event->load(['creator', 'course', 'courseOffering']);
        NotificationService::fromCalendarEvent($event);

        return ApiResponse::success(
            ['event' => new CalendarEventResource($event)],
            'Event created.',
            201
        );
    }

    /**
     * Update an existing calendar event.
     */
    public function update(Request $request, CalendarEvent $event)
    {
        $user = $this->requireUser();
        Gate::authorize('update', $event);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', 'string', 'in:class,assignment,quiz,exam,event'],
            'startAt' => ['required', 'date'],
            'endAt' => ['nullable', 'date', 'after_or_equal:startAt'],
            'location' => ['nullable', 'string', 'max:255'],
            'isAllDay' => ['boolean'],
            'color' => ['nullable', 'string', 'max:7'],
            'courseId' => ['nullable', 'integer', 'exists:courses,id'],
            'courseOfferingId' => ['nullable', 'integer', 'exists:course_offerings,id'],
        ]);

        $event->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'start_at' => $validated['startAt'],
            'end_at' => $validated['endAt'] ?? null,
            'location' => $validated['location'] ?? null,
            'is_all_day' => $validated['isAllDay'] ?? false,
            'color' => $validated['color'] ?? null,
            'course_id' => $validated['courseId'] ?? null,
            'course_offering_id' => $validated['courseOfferingId'] ?? null,
        ]);

        $event->load(['creator', 'course', 'courseOffering']);

        return ApiResponse::success(
            ['event' => new CalendarEventResource($event)],
            'Event updated.'
        );
    }

    /**
     * Delete a calendar event.
     */
    public function destroy(CalendarEvent $event)
    {
        $user = $this->requireUser();
        Gate::authorize('delete', $event);

        $event->delete();

        return ApiResponse::success(['deleted' => true], 'Event deleted.');
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
