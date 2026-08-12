<?php

namespace App\Policies;

use App\Models\CourseOffering;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;

class QuizAttemptPolicy
{
    public function viewAny(User $user, Quiz $quiz): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $quiz->courseOffering->lecturer_id === $user->id;
    }

    public function view(User $user, QuizAttempt $attempt): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('lecturer') && $attempt->quiz->courseOffering->lecturer_id === $user->id) {
            return true;
        }

        return $attempt->student_id === $user->id;
    }

    public function create(User $user, Quiz $quiz): bool
    {
        return $this->isEnrolled($user, $quiz->courseOffering);
    }

    public function answer(User $user, QuizAttempt $attempt): bool
    {
        return $this->ownsActiveAttempt($user, $attempt);
    }

    public function submit(User $user, QuizAttempt $attempt): bool
    {
        return $this->ownsActiveAttempt($user, $attempt);
    }

    private function isEnrolled(User $user, CourseOffering $offering): bool
    {
        return $user->enrollments()
            ->where('course_offering_id', $offering->id)
            ->where('status', 'enrolled')
            ->exists();
    }

    private function ownsActiveAttempt(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->student_id === $user->id && $attempt->status === 'in_progress';
    }
}
