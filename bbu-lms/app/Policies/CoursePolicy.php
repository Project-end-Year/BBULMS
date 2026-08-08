<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    /**
     * Determine whether the user can view the course.
     *
     * Admins may view any course. Lecturers may view courses they teach.
     * Students may view courses they are enrolled in.
     */
    public function view(User $user, Course $course): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer')) {
            return $course->offerings()->where('lecturer_id', $user->id)->exists();
        }

        if ($user->hasRole('student')) {
            return $course->offerings()->whereHas('enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'enrolled');
            })->exists();
        }

        return false;
    }
}
