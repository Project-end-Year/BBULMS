<?php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\CourseOffering;
use App\Models\User;

class AssignmentPolicy
{
    public function view(User $user, Assignment $assignment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $offering = $assignment->courseOffering;

        if ($user->hasRole('lecturer') && $offering && $offering->lecturer_id === $user->id) {
            return true;
        }

        return $user->enrollments()
            ->where('course_offering_id', $assignment->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }

    public function create(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
    }

    public function update(User $user, Assignment $assignment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $assignment->created_by === $user->id;
    }

    public function delete(User $user, Assignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }

    public function grade(User $user, Assignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }

    public function submit(User $user, Assignment $assignment): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $assignment->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }
}
