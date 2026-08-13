<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\AttendanceRecordResource;
use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceSession;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\NotificationService;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Data\QRCodeData;
use chillerlan\QRCode\Output\QRMarkupSVG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AttendanceSessionController extends Controller
{
    /**
     * List attendance sessions for a course offering.
     */
    public function index(CourseOffering $offering)
    {
        $user = $this->requireUser();
        Gate::authorize('viewAny', [AttendanceSession::class, $offering]);

        $sessions = AttendanceSession::query()
            ->where('course_offering_id', $offering->id)
            ->with(['lecturer', 'records.student'])
            ->orderByDesc('starts_at')
            ->get();

        return ApiResponse::success([
            'sessions' => AttendanceSessionResource::collection($sessions),
        ]);
    }

    /**
     * Store a new attendance session.
     */
    public function store(Request $request, CourseOffering $offering)
    {
        $user = $this->requireUser();
        Gate::authorize('create', [AttendanceSession::class, $offering]);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['nullable', 'date', 'after:startsAt'],
            'lateThresholdMinutes' => ['nullable', 'integer', 'min:0'],
        ]);

        $startsAt = new \DateTime($validated['startsAt']);
        $endsAt = isset($validated['endsAt']) ? new \DateTime($validated['endsAt']) : (clone $startsAt)->modify('+1 hour');

        $session = AttendanceSession::create([
            'course_offering_id' => $offering->id,
            'lecturer_id' => $user->id,
            'title' => $validated['title'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'code' => $this->uniqueCode(),
            'qr_token' => Str::random(32),
            'is_active' => true,
            'late_threshold_minutes' => $validated['lateThresholdMinutes'] ?? 15,
        ]);

        // Seed absent records for enrolled students so lecturers see a complete roster.
        $enrolledStudentIds = Enrollment::query()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->pluck('student_id');

        $records = $enrolledStudentIds->map(fn ($studentId) => [
            'attendance_session_id' => $session->id,
            'student_id' => $studentId,
            'status' => 'absent',
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if (! empty($records)) {
            \App\Models\AttendanceRecord::insert($records);
        }

        $session->load(['lecturer', 'records.student']);
        $session->loadCount('records');

        if ($session->is_active) {
            NotificationService::fromAttendanceSession($session, $offering);
        }

        return ApiResponse::success(
            ['session' => new AttendanceSessionResource($session)],
            'Attendance session created.',
            201
        );
    }

    /**
     * Show a single session.
     */
    public function show(CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('view', $session);

        $session->load(['lecturer', 'records.student']);

        return ApiResponse::success([
            'session' => new AttendanceSessionResource($session),
        ]);
    }

    /**
     * Close or re-open a session.
     */
    public function update(Request $request, CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('update', $session);

        $validated = $request->validate([
            'isActive' => ['nullable', 'boolean'],
            'title' => ['nullable', 'string', 'max:255'],
            'startsAt' => ['nullable', 'date'],
            'endsAt' => ['nullable', 'date', 'after:startsAt'],
            'lateThresholdMinutes' => ['nullable', 'integer', 'min:0'],
        ]);

        $updates = [
            'title' => $validated['title'] ?? $session->title,
            'starts_at' => $validated['startsAt'] ?? $session->starts_at,
            'ends_at' => $validated['endsAt'] ?? $session->ends_at,
            'late_threshold_minutes' => $validated['lateThresholdMinutes'] ?? $session->late_threshold_minutes,
        ];

        if (isset($validated['isActive'])) {
            $updates['is_active'] = $validated['isActive'];
            $updates['closed_at'] = $validated['isActive'] ? null : now();
        }

        $session->update($updates);
        $session->load(['lecturer', 'records.student']);
        $session->loadCount('records');

        return ApiResponse::success(
            ['session' => new AttendanceSessionResource($session)],
            'Attendance session updated.'
        );
    }

    /**
     * Delete a session.
     */
    public function destroy(CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('delete', $session);

        $session->delete();

        return ApiResponse::success(['deleted' => true], 'Attendance session deleted.');
    }

    /**
     * Generate a QR code image for a session.
     */
    public function qr(CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('view', $session);

        $url = route('attendance.check-in', ['token' => $session->qr_token], true);

        $options = new QROptions([
            'version' => QRCodeData::VERSION_AUTO,
            'eccLevel' => EccLevel::M,
            'outputType' => QRCode::OUTPUT_MARKUP_SVG,
            'outputInterface' => QRMarkupSVG::class,
            'cssClass' => 'qrcode',
            'moduleValues' => [
                // finder
                QRMarkupSVG::PATH_FINDER_DARK => '#0b2038',
                QRMarkupSVG::PATH_FINDER_LIGHT => '#ffffff',
                // alignment
                QRMarkupSVG::PATH_ALIGNMENT_DARK => '#0b2038',
                QRMarkupSVG::PATH_ALIGNMENT_LIGHT => '#ffffff',
            ],
            'addLogoSpace' => false,
            'imageBase64' => false,
            'scale' => 6,
        ]);

        $svg = (new QRCode($options))->render($url);

        return response($svg)->header('Content-Type', 'image/svg+xml');
    }

    /**
     * Regenerate session tokens.
     */
    public function regenerateToken(CourseOffering $offering, AttendanceSession $session)
    {
        $this->requireUser();
        Gate::authorize('update', $session);

        $session->update([
            'code' => $this->uniqueCode(),
            'qr_token' => Str::random(32),
        ]);

        return ApiResponse::success(
            ['session' => new AttendanceSessionResource($session->load(['lecturer', 'records.student']))],
            'Session tokens regenerated.'
        );
    }

    private function uniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (AttendanceSession::query()->where('code', $code)->exists());

        return $code;
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
