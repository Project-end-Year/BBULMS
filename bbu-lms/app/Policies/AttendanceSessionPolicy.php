<?php

namespace App\Policies;

use App\Models\AttendanceSession;
use App\Models\CourseOffering;
use App\Models\User;

class AttendanceSessionPolicy
{
    public function viewAny(User $user, CourseOffering $offering): bool
    {
        return $this->managesOrEnrolled($user, $offering);
    }

    public function view(User $user, AttendanceSession $session): bool
    {
        return $this->managesOrEnrolled($user, $session->courseOffering);
    }

    public function create(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
    }

    public function update(User $user, AttendanceSession $session): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $session->courseOffering->lecturer_id === $user->id;
    }

    public function delete(User $user, AttendanceSession $session): bool
    {
        return $this->update($user, $session);
    }

    public function manage(User $user, AttendanceSession $session): bool
    {
        return $this->update($user, $session);
    }

    public function checkIn(User $user, AttendanceSession $session): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $session->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }

    private function managesOrEnrolled(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer') && $offering->lecturer_id === $user->id) {
            return true;
        }

        return $user->enrollments()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->exists();
    }
}
