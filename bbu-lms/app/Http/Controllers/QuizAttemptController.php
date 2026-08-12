<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\QuizResource;
use App\Http\Resources\StudentQuizResource;
use App\Models\CourseOffering;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class QuizAttemptController extends Controller
{
    public function start(CourseOffering $offering, Quiz $quiz)
    {
        $user = $this->requireUser();
        Gate::authorize('create', [QuizAttempt::class, $quiz]);

        $this->guardQuizAvailable($quiz);

        $attemptCount = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', $user->id)
            ->count();

        if ($attemptCount >= $quiz->attempts_allowed) {
            return ApiResponse::error('Attempt limit reached for this quiz.', 403);
        }

        $inProgress = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if ($inProgress) {
            return ApiResponse::success(
                $this->attemptResponse($inProgress, $quiz),
                'Resuming in-progress attempt.'
            );
        }

        $questionIds = $quiz->questions()->pluck('id')->toArray();

        if (empty($questionIds)) {
            return ApiResponse::error('This quiz has no questions.', 422);
        }

        if ($quiz->shuffle_questions) {
            shuffle($questionIds);
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'student_id' => $user->id,
            'attempt_number' => $attemptCount + 1,
            'started_at' => now(),
            'submitted_at' => null,
            'expires_at' => $quiz->time_limit_minutes ? now()->addMinutes($quiz->time_limit_minutes) : null,
            'score' => null,
            'max_score' => $quiz->total_points,
            'percentage' => null,
            'status' => 'in_progress',
            'question_order' => $questionIds,
        ]);

        foreach ($questionIds as $questionId) {
            $question = Question::query()->find($questionId);
            QuizAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $questionId,
                'question_option_id' => null,
                'answer_text' => null,
                'is_correct' => null,
                'points_awarded' => 0,
                'points_possible' => $question->points,
                'status' => 'pending',
                'feedback' => null,
            ]);
        }

        return ApiResponse::success(
            $this->attemptResponse($attempt, $quiz),
            'Quiz attempt started.'
        );
    }

    public function show(CourseOffering $offering, Quiz $quiz, QuizAttempt $attempt)
    {
        $this->requireUser();
        Gate::authorize('view', $attempt);

        return ApiResponse::success($this->attemptResponse($attempt, $quiz));
    }

    public function myAttempts(CourseOffering $offering, Quiz $quiz)
    {
        $user = $this->requireUser();

        $attempts = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return ApiResponse::success([
            'attempts' => QuizAttemptResource::collection($attempts),
        ]);
    }

    public function results(CourseOffering $offering, Quiz $quiz)
    {
        $this->requireUser();
        Gate::authorize('viewAny', [QuizAttempt::class, $quiz]);

        $quiz->load('questions');

        $attempts = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('status', 'completed')
            ->with(['student', 'answers.question'])
            ->orderByDesc('created_at')
            ->get();

        $totalAttempts = $attempts->count();
        $scores = $attempts->pluck('percentage')->filter(fn ($p) => $p !== null)->map(fn ($p) => (float) $p)->values();
        $averageScore = $scores->isEmpty() ? null : round($scores->avg(), 2);
        $highestScore = $scores->isEmpty() ? null : $scores->max();
        $lowestScore = $scores->isEmpty() ? null : $scores->min();

        $passingCount = 0;
        if ($quiz->passing_score_percentage !== null) {
            $passingCount = $attempts->filter(
                fn ($a) => $a->percentage !== null && $a->percentage >= $quiz->passing_score_percentage
            )->count();
        }

        $histogram = [];
        if (! $scores->isEmpty()) {
            $bins = [
                ['label' => '0-59%', 'min' => 0, 'max' => 59],
                ['label' => '60-69%', 'min' => 60, 'max' => 69],
                ['label' => '70-79%', 'min' => 70, 'max' => 79],
                ['label' => '80-89%', 'min' => 80, 'max' => 89],
                ['label' => '90-100%', 'min' => 90, 'max' => 100],
            ];

            foreach ($bins as $bin) {
                $histogram[] = [
                    'label' => $bin['label'],
                    'count' => $scores->filter(fn ($s) => $s >= $bin['min'] && $s <= $bin['max'])->count(),
                ];
            }
        }

        $questionStats = [];
        foreach ($quiz->questions as $question) {
            $correctCount = 0;
            $answeredCount = 0;

            foreach ($attempts as $attempt) {
                $answer = $attempt->answers->firstWhere('question_id', $question->id);
                if ($answer && $answer->status !== 'pending') {
                    $answeredCount++;
                    if ($answer->is_correct) {
                        $correctCount++;
                    }
                }
            }

            $questionStats[] = [
                'questionId' => $question->id,
                'prompt' => $question->prompt,
                'correctCount' => $correctCount,
                'answeredCount' => $answeredCount,
                'correctRate' => $answeredCount > 0 ? round(($correctCount / $answeredCount) * 100, 2) : 0,
            ];
        }

        return ApiResponse::success([
            'stats' => [
                'totalAttempts' => $totalAttempts,
                'averageScore' => $averageScore,
                'highestScore' => $highestScore,
                'lowestScore' => $lowestScore,
                'passingCount' => $passingCount,
                'passingScorePercentage' => $quiz->passing_score_percentage,
            ],
            'histogram' => $histogram,
            'questionStats' => $questionStats,
            'attempts' => QuizAttemptResource::collection($attempts),
        ]);
    }

    public function answer(Request $request, CourseOffering $offering, Quiz $quiz, QuizAttempt $attempt)
    {
        $this->requireUser();
        Gate::authorize('answer', $attempt);

        if ($this->isExpired($attempt)) {
            return ApiResponse::error('Quiz time has expired.', 403);
        }

        $validated = $request->validate([
            'questionId' => ['required', 'integer', 'exists:questions,id'],
            'optionId' => ['nullable', 'integer', 'exists:question_options,id'],
            'answerText' => ['nullable', 'string'],
        ]);

        $question = Question::query()->findOrFail($validated['questionId']);

        if ($question->quiz_id !== $quiz->id) {
            return ApiResponse::error('Question does not belong to this quiz.', 422);
        }

        $answer = QuizAnswer::query()
            ->where('quiz_attempt_id', $attempt->id)
            ->where('question_id', $question->id)
            ->firstOrFail();

        if (in_array($question->type, ['multiple_choice', 'true_false'], true)) {
            $option = isset($validated['optionId']) ? QuestionOption::query()->find($validated['optionId']) : null;

            if ($option && $option->question_id !== $question->id) {
                return ApiResponse::error('Option does not belong to this question.', 422);
            }

            $answer->update([
                'question_option_id' => $option?->id,
                'answer_text' => null,
            ]);
        } else {
            $answer->update([
                'question_option_id' => null,
                'answer_text' => $validated['answerText'] ?? null,
            ]);
        }

        return ApiResponse::success(
            [
                'answer' => [
                    'questionId' => $answer->question_id,
                    'optionId' => $answer->question_option_id,
                    'answerText' => $answer->answer_text,
                ],
            ],
            'Answer saved.'
        );
    }

    public function submit(CourseOffering $offering, Quiz $quiz, QuizAttempt $attempt)
    {
        $this->requireUser();
        Gate::authorize('submit', $attempt);

        if ($this->isExpired($attempt)) {
            return ApiResponse::error('Quiz time has expired.', 403);
        }

        $answers = QuizAnswer::query()
            ->where('quiz_attempt_id', $attempt->id)
            ->with('question')
            ->get();

        $score = 0;
        $maxScore = 0;

        foreach ($answers as $answer) {
            $question = $answer->question;
            $maxScore += (float) $question->points;

            if (in_array($question->type, ['multiple_choice', 'true_false'], true)) {
                $correctOption = QuestionOption::query()
                    ->where('question_id', $question->id)
                    ->where('is_correct', true)
                    ->first();

                $isCorrect = $correctOption && $answer->question_option_id === $correctOption->id;

                $answer->update([
                    'is_correct' => $isCorrect,
                    'points_awarded' => $isCorrect ? $question->points : 0,
                    'points_possible' => $question->points,
                    'status' => $isCorrect ? 'correct' : 'incorrect',
                    'feedback' => null,
                ]);

                if ($isCorrect) {
                    $score += (float) $question->points;
                }
            } else {
                $answer->update([
                    'is_correct' => null,
                    'points_awarded' => 0,
                    'points_possible' => $question->points,
                    'status' => 'pending_review',
                    'feedback' => null,
                ]);
            }
        }

        $percentage = $maxScore > 0 ? round(($score / $maxScore) * 100, 2) : 0;

        $attempt->update([
            'submitted_at' => now(),
            'status' => 'completed',
            'score' => $score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
        ]);

        return ApiResponse::success(
            $this->attemptResponse($attempt, $quiz),
            'Quiz submitted.'
        );
    }

    private function attemptResponse(QuizAttempt $attempt, Quiz $quiz): array
    {
        $answers = QuizAnswer::query()
            ->where('quiz_attempt_id', $attempt->id)
            ->get(['question_id', 'question_option_id', 'answer_text', 'is_correct', 'points_awarded', 'points_possible', 'status']);

        $revealCorrect = $attempt->status === 'completed' && $quiz->show_correct_answers;

        return [
            'attempt' => new QuizAttemptResource($attempt->load('student')),
            'quiz' => $revealCorrect
                ? new QuizResource($quiz->load(['questions.options', 'creator']))
                : new StudentQuizResource($quiz->load('questions.options')),
            'answers' => $answers->map(fn ($a) => [
                'questionId' => $a->question_id,
                'optionId' => $a->question_option_id,
                'answerText' => $a->answer_text,
                'isCorrect' => $a->is_correct,
                'pointsAwarded' => $a->points_awarded !== null ? (float) $a->points_awarded : null,
                'pointsPossible' => $a->points_possible !== null ? (float) $a->points_possible : null,
                'status' => $a->status,
            ])->values(),
        ];
    }

    private function guardQuizAvailable(Quiz $quiz): void
    {
        if (! $quiz->is_published) {
            abort(403, 'This quiz is not published.');
        }

        if ($quiz->starts_at && now()->lt($quiz->starts_at)) {
            abort(403, 'This quiz has not started yet.');
        }

        if ($quiz->ends_at && now()->gt($quiz->ends_at)) {
            abort(403, 'This quiz has ended.');
        }
    }

    private function isExpired(QuizAttempt $attempt): bool
    {
        return $attempt->expires_at && now()->gt($attempt->expires_at);
    }

    private function requireUser(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        return $user;
    }
}
