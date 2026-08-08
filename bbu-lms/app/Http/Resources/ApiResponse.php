<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiResponse
{
    /**
     * Build a consistent JSON success envelope.
     *
     * @param  mixed  $data
     * @param  string|null  $message
     * @param  int  $status
     */
    public static function success(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Build a consistent JSON error envelope.
     *
     * @param  string|null  $message
     * @param  int  $status
     * @param  mixed  $errors
     */
    public static function error(?string $message = null, int $status = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
