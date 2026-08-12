<?php

use App\Events\TestBroadcastEvent;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AssignmentSubmissionController;
use App\Http\Controllers\AttendanceRecordController;
use App\Http\Controllers\AttendanceSessionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GradeComponentController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GradeHistoryController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ClassScheduleController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\CourseMaterialController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentSearchController;
use App\Http\Controllers\UserController;
use App\Http\Resources\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ApiResponse::success([
        'status' => 'ok',
        'service' => 'bbu-lms-api',
        'time' => now()->toIso8601String(),
    ]);
});

Route::post('/broadcast-test', function () {
    broadcast(new TestBroadcastEvent('Ping from BBU LMS'))->toOthers();

    return ApiResponse::success(['message' => 'Broadcast dispatched.']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    Route::get('/my-courses', [CourseOfferingController::class, 'myCourses']);
    Route::get('/announcements', [AnnouncementController::class, 'feed']);

    Route::get('/calendar/events', [CalendarEventController::class, 'index']);
    Route::post('/calendar/events', [CalendarEventController::class, 'store']);
    Route::put('/calendar/events/{event}', [CalendarEventController::class, 'update']);
    Route::delete('/calendar/events/{event}', [CalendarEventController::class, 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations/direct', [ConversationController::class, 'storeDirect']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/conversations/{conversation}/typing', [ConversationController::class, 'typing']);
    Route::post('/conversations/{conversation}/mark-read', [ConversationController::class, 'markRead']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::put('/conversations/{conversation}/messages/{message}', [MessageController::class, 'update']);
    Route::delete('/conversations/{conversation}/messages/{message}', [MessageController::class, 'destroy']);

    Route::get('/course-offerings/{offering}/conversation', [ConversationController::class, 'showForOffering']);

    Route::get('/courses/{course}/summary', [CourseController::class, 'summary']);
    Route::get('/courses/{course}/class-schedules', [ClassScheduleController::class, 'index']);
    Route::get('/courses/{course}/announcements', [AnnouncementController::class, 'index']);
    Route::post('/courses/{course}/announcements', [AnnouncementController::class, 'store']);
    Route::put('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'destroy']);

    Route::get('/course-offerings/{offering}/enrollments', [EnrollmentController::class, 'index']);
    Route::post('/course-offerings/{offering}/enrollments', [EnrollmentController::class, 'store']);
    Route::delete('/course-offerings/{offering}/enrollments/{student}', [EnrollmentController::class, 'destroy']);

    Route::get('/students/search', [StudentSearchController::class, '__invoke']);

    Route::get('/course-offerings/{offering}/materials', [CourseMaterialController::class, 'index']);
    Route::post('/course-offerings/{offering}/materials', [CourseMaterialController::class, 'store']);
    Route::put('/course-offerings/{offering}/materials/{material}', [CourseMaterialController::class, 'update']);
    Route::delete('/course-offerings/{offering}/materials/{material}', [CourseMaterialController::class, 'destroy']);
    Route::get('/course-offerings/{offering}/materials/tracking', [CourseMaterialController::class, 'tracking']);

    Route::get('/course-offerings/{offering}/assignments', [AssignmentController::class, 'index']);
    Route::post('/course-offerings/{offering}/assignments', [AssignmentController::class, 'store']);
    Route::get('/course-offerings/{offering}/assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::put('/course-offerings/{offering}/assignments/{assignment}', [AssignmentController::class, 'update']);
    Route::delete('/course-offerings/{offering}/assignments/{assignment}', [AssignmentController::class, 'destroy']);

    Route::get('/course-offerings/{offering}/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'index']);
    Route::get('/course-offerings/{offering}/assignments/{assignment}/my-submission', [AssignmentSubmissionController::class, 'mySubmission']);
    Route::post('/course-offerings/{offering}/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'store']);
    Route::post('/course-offerings/{offering}/assignments/{assignment}/submissions/{submission}/grade', [AssignmentSubmissionController::class, 'grade']);

    Route::get('/course-materials/{material}/download', [CourseMaterialController::class, 'download']);
    Route::get('/course-materials/{material}/preview', [CourseMaterialController::class, 'preview']);
    Route::post('/course-materials/{material}/track-view', [CourseMaterialController::class, 'trackView']);

    Route::get('/course-offerings/{offering}/attendance-sessions', [AttendanceSessionController::class, 'index']);
    Route::post('/course-offerings/{offering}/attendance-sessions', [AttendanceSessionController::class, 'store']);
    Route::get('/course-offerings/{offering}/attendance-sessions/{session}', [AttendanceSessionController::class, 'show']);
    Route::put('/course-offerings/{offering}/attendance-sessions/{session}', [AttendanceSessionController::class, 'update']);
    Route::delete('/course-offerings/{offering}/attendance-sessions/{session}', [AttendanceSessionController::class, 'destroy']);
    Route::get('/course-offerings/{offering}/attendance-sessions/{session}/qr', [AttendanceSessionController::class, 'qr']);
    Route::post('/course-offerings/{offering}/attendance-sessions/{session}/regenerate-token', [AttendanceSessionController::class, 'regenerateToken']);

    Route::get('/course-offerings/{offering}/attendance-sessions/{session}/records', [AttendanceRecordController::class, 'index']);
    Route::get('/course-offerings/{offering}/attendance-sessions/{session}/my-record', [AttendanceRecordController::class, 'myRecord']);
    Route::put('/course-offerings/{offering}/attendance-sessions/{session}/records/{record}', [AttendanceRecordController::class, 'update']);
    Route::get('/course-offerings/{offering}/attendance-history', [AttendanceRecordController::class, 'history']);
    Route::post('/attendance/check-in', [AttendanceRecordController::class, 'checkIn'])->name('attendance.check-in');

    Route::get('/course-offerings/{offering}/grade-components', [GradeComponentController::class, 'index']);
    Route::post('/course-offerings/{offering}/grade-components', [GradeComponentController::class, 'store']);
    Route::put('/course-offerings/{offering}/grade-components/{component}', [GradeComponentController::class, 'update']);
    Route::delete('/course-offerings/{offering}/grade-components/{component}', [GradeComponentController::class, 'destroy']);

    Route::get('/course-offerings/{offering}/quizzes', [QuizController::class, 'index']);
    Route::post('/course-offerings/{offering}/quizzes', [QuizController::class, 'store']);
    Route::get('/course-offerings/{offering}/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::put('/course-offerings/{offering}/quizzes/{quiz}', [QuizController::class, 'update']);
    Route::delete('/course-offerings/{offering}/quizzes/{quiz}', [QuizController::class, 'destroy']);
    Route::post('/course-offerings/{offering}/quizzes/{quiz}/toggle-published', [QuizController::class, 'togglePublished']);

    Route::post('/course-offerings/{offering}/quizzes/{quiz}/start', [QuizAttemptController::class, 'start']);
    Route::get('/course-offerings/{offering}/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'myAttempts']);
    Route::get('/course-offerings/{offering}/quizzes/{quiz}/attempts/{attempt}', [QuizAttemptController::class, 'show']);
    Route::post('/course-offerings/{offering}/quizzes/{quiz}/attempts/{attempt}/answer', [QuizAttemptController::class, 'answer']);
    Route::post('/course-offerings/{offering}/quizzes/{quiz}/attempts/{attempt}/submit', [QuizAttemptController::class, 'submit']);
    Route::get('/course-offerings/{offering}/quizzes/{quiz}/results', [QuizAttemptController::class, 'results']);

    Route::get('/course-offerings/{offering}/grades', [GradeController::class, 'index']);
    Route::get('/course-offerings/{offering}/grades/me', [GradeController::class, 'myGrades']);
    Route::get('/course-offerings/{offering}/grades/students/{student}', [GradeController::class, 'forStudent']);
    Route::post('/course-offerings/{offering}/grades/recalculate', [GradeController::class, 'recalculate']);
    Route::post('/course-offerings/{offering}/grades', [GradeController::class, 'storeOrUpdate']);

    Route::get('/grade-history', [GradeHistoryController::class, 'myHistory']);
    Route::get('/grade-history/summary', [GradeHistoryController::class, 'myCurrentSummary']);
    Route::get('/students/{student}/grade-history', [GradeHistoryController::class, 'forStudent']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users/form-meta', [UserController::class, 'formMeta']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'toggleActive']);
        Route::put('/users/{user}/roles', [UserController::class, 'updateRoles']);

        Route::get('/courses/form-meta', [CourseController::class, 'formMeta']);
        Route::get('/courses', [CourseController::class, 'index']);
        Route::post('/courses', [CourseController::class, 'store']);
        Route::get('/courses/{course}', [CourseController::class, 'show']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        Route::get('/course-offerings', [CourseOfferingController::class, 'myCourses']);
        Route::post('/course-offerings', [CourseOfferingController::class, 'store']);
        Route::put('/course-offerings/{offering}', [CourseOfferingController::class, 'update']);
        Route::delete('/course-offerings/{offering}', [CourseOfferingController::class, 'destroy']);
    });
});
