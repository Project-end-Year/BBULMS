<?php

namespace App\Policies;

use App\Models\CourseOffering;
use App\Models\Grade;
use App\Models\User;

class GradePolicy
{
    public function viewAny(User $user, CourseOffering $offering): bool
    {
        return $this->managesOrEnrolled($user, $offering);
    }

    public function viewOwn(User $user, CourseOffering $offering): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->exists();
    }

    public function view(User $user, Grade $grade): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer') && $grade->courseOffering->lecturer_id === $user->id) {
            return true;
        }

        return $grade->student_id === $user->id;
    }

    public function update(User $user, Grade $grade): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $grade->courseOffering->lecturer_id === $user->id;
    }

    public function manage(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
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
