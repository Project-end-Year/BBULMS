<?php

namespace App\Policies;

use App\Models\CalendarEvent;
use App\Models\User;

class CalendarEventPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, CalendarEvent $event): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'lecturer', 'student']);
    }

    public function update(User $user, CalendarEvent $event): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $event->created_by === $user->id;
    }

    public function delete(User $user, CalendarEvent $event): bool
    {
        return $this->update($user, $event);
    }
}
