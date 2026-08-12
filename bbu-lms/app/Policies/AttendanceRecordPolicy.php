<?php

namespace App\Policies;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\User;

class AttendanceRecordPolicy
{
    public function viewAny(User $user, AttendanceSession $session): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $session->courseOffering->lecturer_id === $user->id;
    }

    public function viewOwn(User $user, AttendanceSession $session): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $session->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }

    public function update(User $user, AttendanceRecord $record): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $record->session->courseOffering->lecturer_id === $user->id;
    }

    public function checkIn(User $user, AttendanceSession $session): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $session->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }
}
