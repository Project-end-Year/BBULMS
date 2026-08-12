<?php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;

class AssignmentSubmissionPolicy
{
    public function viewAny(User $user, Assignment $assignment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer')) {
            return $assignment->courseOffering->lecturer_id === $user->id;
        }

        return $user->enrollments()
            ->where('course_offering_id', $assignment->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }

    public function view(User $user, AssignmentSubmission $submission): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer')) {
            return $submission->assignment->courseOffering->lecturer_id === $user->id;
        }

        return $submission->student_id === $user->id;
    }

    public function submit(User $user, Assignment $assignment): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $assignment->course_offering_id)
            ->where('status', 'enrolled')
            ->exists();
    }

    public function grade(User $user, AssignmentSubmission $submission): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer')
            && $submission->assignment->courseOffering->lecturer_id === $user->id;
    }
}
