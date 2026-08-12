<?php

namespace App\Policies;

use App\Models\CourseOffering;
use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function viewAny(User $user, CourseOffering $offering): bool
    {
        return $this->managesOrEnrolled($user, $offering);
    }

    public function view(User $user, Quiz $quiz): bool
    {
        return $this->managesOrEnrolled($user, $quiz->courseOffering);
    }

    public function viewPublished(User $user, Quiz $quiz): bool
    {
        return $this->managesOrEnrolled($user, $quiz->courseOffering);
    }

    public function create(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
    }

    public function update(User $user, Quiz $quiz): bool
    {
        return $this->create($user, $quiz->courseOffering);
    }

    public function delete(User $user, Quiz $quiz): bool
    {
        return $this->update($user, $quiz);
    }

    public function manage(User $user, CourseOffering $offering): bool
    {
        return $this->create($user, $offering);
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
