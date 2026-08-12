<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\QuizResource;
use App\Models\CourseOffering;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class QuizController extends Controller
{
    public function index(CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('viewAny', [Quiz::class, $offering]);

        $user = Auth::user();
        $isManager = $user->hasRole('admin') || ($user->hasRole('lecturer') && $offering->lecturer_id === $user->id);

        $query = Quiz::query()
            ->where('course_offering_id', $offering->id)
            ->withCount('questions')
            ->orderByDesc('created_at');

        if (! $isManager) {
            $query->where('is_published', true);
        }

        $quizzes = $query->get();

        return ApiResponse::success([
            'quizzes' => QuizResource::collection($quizzes),
        ]);
    }

    public function store(Request $request, CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('create', [Quiz::class, $offering]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:quiz,exam,practice'],
            'timeLimitMinutes' => ['nullable', 'integer', 'min:1'],
            'attemptsAllowed' => ['nullable', 'integer', 'min:1'],
            'shuffleQuestions' => ['nullable', 'boolean'],
            'showCorrectAnswers' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
            'startsAt' => ['nullable', 'date'],
            'endsAt' => ['nullable', 'date', 'after_or_equal:startsAt'],
            'passingScorePercentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'questions' => ['nullable', 'array'],
            'questions.*.type' => ['required', 'string', 'in:multiple_choice,true_false,short_answer'],
            'questions.*.prompt' => ['required', 'string'],
            'questions.*.points' => ['nullable', 'numeric', 'min:0'],
            'questions.*.order' => ['nullable', 'integer', 'min:0'],
            'questions.*.explanation' => ['nullable', 'string'],
            'questions.*.options' => ['required_if:questions.*.type,multiple_choice', 'required_if:questions.*.type,true_false', 'array'],
            'questions.*.options.*.optionText' => ['required', 'string'],
            'questions.*.options.*.isCorrect' => ['required', 'boolean'],
            'questions.*.options.*.order' => ['nullable', 'integer', 'min:0'],
        ]);

        $quiz = Quiz::create([
            'course_offering_id' => $offering->id,
            'created_by' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'time_limit_minutes' => $validated['timeLimitMinutes'] ?? null,
            'attempts_allowed' => $validated['attemptsAllowed'] ?? 1,
            'shuffle_questions' => $validated['shuffleQuestions'] ?? false,
            'show_correct_answers' => $validated['showCorrectAnswers'] ?? false,
            'is_published' => $validated['isPublished'] ?? false,
            'starts_at' => $validated['startsAt'] ?? null,
            'ends_at' => $validated['endsAt'] ?? null,
            'total_points' => 0,
            'passing_score_percentage' => $validated['passingScorePercentage'] ?? null,
        ]);

        if (! empty($validated['questions'])) {
            $this->syncQuestions($quiz, $validated['questions']);
        }

        return ApiResponse::success(
            ['quiz' => new QuizResource($quiz->load(['questions.options', 'creator']))],
            'Quiz created.',
            201
        );
    }

    public function show(CourseOffering $offering, Quiz $quiz)
    {
        $this->requireUser();
        Gate::authorize('view', $quiz);

        $quiz->load(['questions.options', 'creator']);

        return ApiResponse::success(['quiz' => new QuizResource($quiz)]);
    }

    public function update(Request $request, CourseOffering $offering, Quiz $quiz)
    {
        $this->requireUser();
        Gate::authorize('update', $quiz);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:quiz,exam,practice'],
            'timeLimitMinutes' => ['nullable', 'integer', 'min:1'],
            'attemptsAllowed' => ['nullable', 'integer', 'min:1'],
            'shuffleQuestions' => ['nullable', 'boolean'],
            'showCorrectAnswers' => ['nullable', 'boolean'],
            'isPublished' => ['nullable', 'boolean'],
            'startsAt' => ['nullable', 'date'],
            'endsAt' => ['nullable', 'date', 'after_or_equal:startsAt'],
            'passingScorePercentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'questions' => ['nullable', 'array'],
            'questions.*.id' => ['nullable', 'integer', 'exists:questions,id'],
            'questions.*.type' => ['required', 'string', 'in:multiple_choice,true_false,short_answer'],
            'questions.*.prompt' => ['required', 'string'],
            'questions.*.points' => ['nullable', 'numeric', 'min:0'],
            'questions.*.order' => ['nullable', 'integer', 'min:0'],
            'questions.*.explanation' => ['nullable', 'string'],
            'questions.*.options' => ['required_if:questions.*.type,multiple_choice', 'required_if:questions.*.type,true_false', 'array'],
            'questions.*.options.*.id' => ['nullable', 'integer', 'exists:question_options,id'],
            'questions.*.options.*.optionText' => ['required', 'string'],
            'questions.*.options.*.isCorrect' => ['required', 'boolean'],
            'questions.*.options.*.order' => ['nullable', 'integer', 'min:0'],
        ]);

        $quiz->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? $quiz->description,
            'type' => $validated['type'],
            'time_limit_minutes' => $validated['timeLimitMinutes'] ?? $quiz->time_limit_minutes,
            'attempts_allowed' => $validated['attemptsAllowed'] ?? $quiz->attempts_allowed,
            'shuffle_questions' => $validated['shuffleQuestions'] ?? $quiz->shuffle_questions,
            'show_correct_answers' => $validated['showCorrectAnswers'] ?? $quiz->show_correct_answers,
            'is_published' => $validated['isPublished'] ?? $quiz->is_published,
            'starts_at' => $validated['startsAt'] ?? $quiz->starts_at,
            'ends_at' => $validated['endsAt'] ?? $quiz->ends_at,
            'passing_score_percentage' => $validated['passingScorePercentage'] ?? $quiz->passing_score_percentage,
        ]);

        if (isset($validated['questions'])) {
            $this->syncQuestions($quiz, $validated['questions']);
        }

        return ApiResponse::success(
            ['quiz' => new QuizResource($quiz->load(['questions.options', 'creator']))],
            'Quiz updated.'
        );
    }

    public function destroy(CourseOffering $offering, Quiz $quiz)
    {
        $this->requireUser();
        Gate::authorize('delete', $quiz);

        $quiz->delete();

        return ApiResponse::success(['deleted' => true], 'Quiz deleted.');
    }

    public function togglePublished(CourseOffering $offering, Quiz $quiz)
    {
        $this->requireUser();
        Gate::authorize('update', $quiz);

        $quiz->update(['is_published' => ! $quiz->is_published]);

        return ApiResponse::success(
            ['quiz' => new QuizResource($quiz->load(['questions.options', 'creator']))],
            $quiz->is_published ? 'Quiz published.' : 'Quiz unpublished.'
        );
    }

    private function syncQuestions(Quiz $quiz, array $questions): void
    {
        $keepQuestionIds = [];
        $totalPoints = 0;

        foreach ($questions as $index => $questionData) {
            $questionId = $questionData['id'] ?? null;

            $questionPayload = [
                'type' => $questionData['type'],
                'prompt' => $questionData['prompt'],
                'points' => $questionData['points'] ?? 1,
                'order' => $questionData['order'] ?? $index,
                'explanation' => $questionData['explanation'] ?? null,
            ];

            if ($questionId) {
                $question = Question::query()
                    ->where('id', $questionId)
                    ->where('quiz_id', $quiz->id)
                    ->firstOrFail();
                $question->update($questionPayload);
            } else {
                $question = $quiz->questions()->create($questionPayload);
            }

            $keepQuestionIds[] = $question->id;
            $totalPoints += (float) $questionPayload['points'];

            if (in_array($question->type, ['multiple_choice', 'true_false']) && ! empty($questionData['options'])) {
                $this->syncOptions($question, $questionData['options']);
            } else {
                $question->options()->delete();
            }
        }

        $quiz->questions()->whereNotIn('id', $keepQuestionIds)->delete();
        $quiz->update(['total_points' => $totalPoints]);
    }

    private function syncOptions(Question $question, array $options): void
    {
        $keepOptionIds = [];

        foreach ($options as $index => $optionData) {
            $optionId = $optionData['id'] ?? null;

            $optionPayload = [
                'option_text' => $optionData['optionText'],
                'is_correct' => $optionData['isCorrect'] ?? false,
                'order' => $optionData['order'] ?? $index,
            ];

            if ($optionId) {
                $option = QuestionOption::query()
                    ->where('id', $optionId)
                    ->where('question_id', $question->id)
                    ->firstOrFail();
                $option->update($optionPayload);
            } else {
                $option = $question->options()->create($optionPayload);
            }

            $keepOptionIds[] = $option->id;
        }

        $question->options()->whereNotIn('id', $keepOptionIds)->delete();
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
