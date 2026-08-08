<?php

use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ApiResponse::success([
        'status' => 'ok',
        'service' => 'bbu-lms-api',
        'time' => now()->toIso8601String(),
    ]);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return ApiResponse::success(new UserResource($request->user()->load('department', 'roles')));
});
