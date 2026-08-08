<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassScheduleController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\ProfileController;
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
    Route::get('/courses/{course}/summary', [CourseController::class, 'summary']);
    Route::get('/courses/{course}/class-schedules', [ClassScheduleController::class, 'index']);

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
