<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\AttendanceRecordResource;
use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class AttendanceRecordController extends Controller
{
    /**
     * List all records for a session (lecturer/admin only).
     */
    public function index(CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('viewAny', [AttendanceRecord::class, $session]);

        $records = AttendanceRecord::query()
            ->where('attendance_session_id', $session->id)
            ->with('student')
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'records' => AttendanceRecordResource::collection($records),
        ]);
    }

    /**
     * Show the current user's record for a session.
     */
    public function myRecord(CourseOffering $offering, AttendanceSession $session)
    {
        $user = $this->requireUser();
        Gate::authorize('viewOwn', [AttendanceRecord::class, $session]);

        $record = AttendanceRecord::query()
            ->where('attendance_session_id', $session->id)
            ->where('student_id', $user->id)
            ->first();

        return ApiResponse::success([
            'record' => $record ? new AttendanceRecordResource($record->load('student')) : null,
        ]);
    }

    /**
     * Student check-in via QR token or short code.
     */
    public function checkIn(Request $request)
    {
        $user = $this->requireUser();

        $validated = $request->validate([
            'token' => ['nullable', 'string', 'min:6'],
            'code' => ['nullable', 'string', 'min:4'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        if (empty($validated['token']) && empty($validated['code'])) {
            return ApiResponse::error('A token or code is required.', 422);
        }

        $query = AttendanceSession::query()->where('is_active', true);

        if (! empty($validated['token'])) {
            $query->where(function ($q) use ($validated) {
                $q->where('qr_token', $validated['token'])
                    ->orWhere('code', $validated['token']);
            });
        } else {
            $query->where('code', $validated['code']);
        }

        $session = $query->first();

        if (! $session) {
            return ApiResponse::error('Invalid or expired attendance session.', 404);
        }

        Gate::authorize('checkIn', $session);

        if ($session->ends_at && now() > $session->ends_at) {
            return ApiResponse::error('Attendance session has ended.', 403);
        }

        $record = AttendanceRecord::query()
            ->firstOrNew([
                'attendance_session_id' => $session->id,
                'student_id' => $user->id,
            ]);

        $now = now();
        $status = 'present';

        if ($session->starts_at && $now > $session->starts_at->clone()->addMinutes($session->late_threshold_minutes)) {
            $status = 'late';
        }

        $record->fill([
            'status' => $status,
            'checked_in_at' => $now,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'check_in_method' => ! empty($validated['token']) ? 'qr' : 'code',
        ]);
        $record->save();

        return ApiResponse::success(
            ['record' => new AttendanceRecordResource($record->load('student'))],
            'Attendance recorded.',
            201
        );
    }

    /**
     * Manual override by lecturer/admin.
     */
    public function update(Request $request, CourseOffering $offering, AttendanceSession $session, AttendanceRecord $record)
    {
        $this->requireUser();
        Gate::authorize('update', $record);

        if ($record->attendance_session_id !== $session->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:present,late,absent,excused'],
            'feedback' => ['nullable', 'string'],
        ]);

        $record->update([
            'status' => $validated['status'],
            'checked_in_at' => $validated['status'] === 'absent' ? null : ($record->checked_in_at ?? now()),
            'check_in_method' => $record->check_in_method ?? 'manual',
        ]);

        return ApiResponse::success(
            ['record' => new AttendanceRecordResource($record->load('student'))],
            'Attendance record updated.'
        );
    }

    /**
     * Attendance summary/history for a course offering.
     */
    public function history(CourseOffering $offering)
    {
        $user = $this->requireUser();

        if ($user->hasRole('admin') || ($user->hasRole('lecturer') && $offering->lecturer_id === $user->id)) {
            return $this->lecturerHistory($offering);
        }

        $isEnrolled = $user->enrollments()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->exists();

        if (! $isEnrolled) {
            abort(403);
        }

        return $this->studentHistory($offering, $user);
    }

    private function lecturerHistory(CourseOffering $offering)
    {
        $sessions = AttendanceSession::query()
            ->where('course_offering_id', $offering->id)
            ->withCount('records')
            ->orderByDesc('starts_at')
            ->get();

        $records = AttendanceRecord::query()
            ->whereHas('session', function ($q) use ($offering) {
                $q->where('course_offering_id', $offering->id);
            })
            ->with(['student', 'session'])
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'sessions' => AttendanceSessionResource::collection($sessions),
            'records' => AttendanceRecordResource::collection($records),
        ]);
    }

    private function studentHistory(CourseOffering $offering, User $student)
    {
        $sessions = AttendanceSession::query()
            ->where('course_offering_id', $offering->id)
            ->withCount('records')
            ->orderByDesc('starts_at')
            ->get();

        $records = AttendanceRecord::query()
            ->whereHas('session', function ($q) use ($offering) {
                $q->where('course_offering_id', $offering->id);
            })
            ->where('student_id', $student->id)
            ->with('session')
            ->orderByDesc('created_at')
            ->get();

        $counts = [
            'total' => $sessions->count(),
            'present' => $records->where('status', 'present')->count(),
            'late' => $records->where('status', 'late')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'excused' => $records->where('status', 'excused')->count(),
        ];

        $attended = $counts['present'] + $counts['late'];
        $counts['percentage'] = $counts['total'] > 0
            ? round(($attended / $counts['total']) * 100, 2)
            : 0;

        return ApiResponse::success([
            'sessions' => AttendanceSessionResource::collection($sessions),
            'records' => AttendanceRecordResource::collection($records),
            'summary' => $counts,
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
