<?php

namespace App\Policies;

use App\Models\CourseOffering;
use App\Models\GradeComponent;
use App\Models\User;

class GradeComponentPolicy
{
    public function viewAny(User $user, CourseOffering $offering): bool
    {
        return $this->managesOrEnrolled($user, $offering);
    }

    public function view(User $user, GradeComponent $component): bool
    {
        return $this->managesOrEnrolled($user, $component->courseOffering);
    }

    public function create(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
    }

    public function update(User $user, GradeComponent $component): bool
    {
        return $this->create($user, $component->courseOffering);
    }

    public function delete(User $user, GradeComponent $component): bool
    {
        return $this->update($user, $component);
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
