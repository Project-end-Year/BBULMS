<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $this->requireUser();

        $validated = $request->validate([
            'unreadOnly' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Notification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if (! empty($validated['unreadOnly'])) {
            $query->whereNull('read_at');
        }

        $limit = $validated['limit'] ?? 50;
        $notifications = $query->limit($limit)->get();

        $unreadCount = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return ApiResponse::success([
            'notifications' => NotificationResource::collection($notifications),
            'unreadCount' => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Notification $notification)
    {
        $user = $this->requireUser();

        if ($notification->user_id !== $user->id) {
            abort(403);
        }

        $notification->markAsRead();

        return ApiResponse::success(['read' => true]);
    }

    /**
     * Mark all unread notifications as read for the authenticated user.
     */
    public function markAllRead()
    {
        $user = $this->requireUser();

        Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ApiResponse::success(['read' => true]);
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
