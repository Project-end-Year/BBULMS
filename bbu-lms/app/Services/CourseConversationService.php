<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\CourseOffering;
use Illuminate\Support\Facades\DB;

class CourseConversationService
{
    /**
     * Ensure a course offering has a group conversation and that the lecturer
     * and all enrolled students are participants.
     */
    public function ensureForOffering(CourseOffering $offering): Conversation
    {
        $conversation = Conversation::query()
            ->where('type', 'course')
            ->where('course_offering_id', $offering->id)
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'type' => 'course',
                'title' => $this->titleForOffering($offering),
                'description' => 'Group conversation for '.$offering->course->name,
                'course_offering_id' => $offering->id,
                'created_by' => $offering->lecturer_id,
                'is_active' => true,
            ]);
        }

        $this->syncParticipants($conversation, $offering);

        return $conversation;
    }

    private function titleForOffering(CourseOffering $offering): string
    {
        $course = $offering->course;
        $parts = [];

        if ($course?->code) {
            $parts[] = $course->code;
        }

        if ($offering->section) {
            $parts[] = $offering->section;
        }

        $parts[] = $course?->name ?? 'Course';

        return implode(' - ', $parts);
    }

    private function syncParticipants(Conversation $conversation, CourseOffering $offering): void
    {
        $desiredUserIds = [];

        if ($offering->lecturer_id) {
            $desiredUserIds[] = $offering->lecturer_id;
        }

        $enrolledStudentIds = $offering->enrollments()
            ->where('status', 'enrolled')
            ->pluck('student_id')
            ->toArray();

        $desiredUserIds = array_unique(array_merge($desiredUserIds, $enrolledStudentIds));

        $existingUserIds = $conversation->participants()
            ->pluck('user_id')
            ->toArray();

        $toAdd = array_diff($desiredUserIds, $existingUserIds);
        $toRemove = array_diff($existingUserIds, $desiredUserIds);

        foreach ($toAdd as $userId) {
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $userId,
                'role' => $userId === $offering->lecturer_id ? 'admin' : 'member',
            ]);
        }

        if (! empty($toRemove)) {
            $conversation->participants()
                ->whereIn('user_id', $toRemove)
                ->delete();
        }
    }
}
