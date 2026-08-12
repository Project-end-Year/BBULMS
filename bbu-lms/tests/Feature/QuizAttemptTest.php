<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QuizAttemptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function createOfferingContext(): array
    {
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);
        $semester = Semester::factory()->create();
        $course = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
        ]);
        $lecturer = User::factory()->create()->assignRole('lecturer');
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        return compact('course', 'lecturer', 'offering');
    }

    private function createPublishedQuiz(CourseOffering $offering, User $lecturer): Quiz
    {
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $offering->id,
            'created_by' => $lecturer->id,
            'is_published' => true,
            'attempts_allowed' => 2,
            'time_limit_minutes' => 30,
            'total_points' => 10,
            'show_correct_answers' => true,
        ]);

        $mc = Question::factory()->multipleChoice()->create([
            'quiz_id' => $quiz->id,
            'points' => 5,
        ]);
        QuestionOption::factory()->correct()->create([
            'question_id' => $mc->id,
            'option_text' => 'Correct',
            'order' => 0,
        ]);
        QuestionOption::factory()->create([
            'question_id' => $mc->id,
            'option_text' => 'Wrong',
            'is_correct' => false,
            'order' => 1,
        ]);

        $tf = Question::factory()->trueFalse()->create([
            'quiz_id' => $quiz->id,
            'points' => 3,
        ]);
        QuestionOption::factory()->create([
            'question_id' => $tf->id,
            'option_text' => 'True',
            'is_correct' => false,
            'order' => 0,
        ]);
        QuestionOption::factory()->correct()->create([
            'question_id' => $tf->id,
            'option_text' => 'False',
            'order' => 1,
        ]);

        $sa = Question::factory()->shortAnswer()->create([
            'quiz_id' => $quiz->id,
            'points' => 2,
        ]);

        return $quiz;
    }

    public function test_student_can_start_quiz_attempt(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/start"
        );

        $response->assertOk()
            ->assertJsonPath('data.attempt.status', 'in_progress')
            ->assertJsonPath('data.attempt.attemptNumber', 1)
            ->assertJsonPath('data.attempt.maxScore', 10)
            ->assertJsonCount(3, 'data.quiz.questions')
            ->assertJsonPath('data.answers.0.optionId', null)
            ->assertJsonPath('data.answers.0.answerText', null);

        $this->assertDatabaseCount('quiz_attempts', 1);
        $this->assertDatabaseCount('quiz_answers', 3);
    }

    public function test_starting_in_progress_attempt_resumes_it(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'in_progress',
            'attempt_number' => 1,
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/start"
        );

        $response->assertOk()
            ->assertJsonPath('data.attempt.id', $attempt->id)
            ->assertJsonPath('data.attempt.status', 'in_progress');

        $this->assertDatabaseCount('quiz_attempts', 1);
    }

    public function test_student_can_autosave_answer(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'in_progress',
        ]);

        $mcQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'multiple_choice')->first();
        $correctOption = QuestionOption::query()->where('question_id', $mcQuestion->id)->where('is_correct', true)->first();

        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $mcQuestion->id,
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}/answer",
            [
                'questionId' => $mcQuestion->id,
                'optionId' => $correctOption->id,
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.answer.optionId', $correctOption->id)
            ->assertJsonPath('data.answer.answerText', null);

        $this->assertDatabaseHas('quiz_answers', [
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => $correctOption->id,
        ]);
    }

    public function test_student_can_submit_and_autograde_quiz(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'in_progress',
        ]);

        $mcQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'multiple_choice')->first();
        $correctMcOption = QuestionOption::query()->where('question_id', $mcQuestion->id)->where('is_correct', true)->first();

        $tfQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'true_false')->first();
        $correctTfOption = QuestionOption::query()->where('question_id', $tfQuestion->id)->where('is_correct', true)->first();

        $saQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'short_answer')->first();

        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => $correctMcOption->id,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $tfQuestion->id,
            'question_option_id' => $correctTfOption->id,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $saQuestion->id,
            'answer_text' => 'A short answer',
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}/submit"
        );

        $response->assertOk()
            ->assertJsonPath('data.attempt.status', 'completed')
            ->assertJsonPath('data.attempt.score', 8)
            ->assertJsonPath('data.attempt.percentage', 80)
            ->assertJsonPath('data.quiz.questions.0.options.0.isCorrect', true);

        $this->assertDatabaseHas('quiz_answers', [
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $saQuestion->id,
            'status' => 'pending_review',
        ]);
    }

    public function test_attempt_limit_is_enforced(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);
        $quiz->update(['attempts_allowed' => 1]);

        QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'attempt_number' => 1,
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/start"
        );

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Attempt limit reached for this quiz.');
    }

    public function test_unpublished_quiz_cannot_be_started(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);
        $quiz->update(['is_published' => false]);

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/start")
            ->assertForbidden();
    }

    public function test_non_enrolled_student_cannot_start_attempt(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/start")
            ->assertForbidden();
    }

    public function test_other_student_cannot_view_or_submit_attempt(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        $otherStudent = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $otherStudent->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);
        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'in_progress',
        ]);

        $this->actingAs($otherStudent)
            ->getJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}")
            ->assertForbidden();

        $this->actingAs($otherStudent)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}/submit")
            ->assertForbidden();
    }

    public function test_expired_attempt_cannot_answer_or_submit(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);
        $question = Question::query()->where('quiz_id', $quiz->id)->first();
        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'in_progress',
            'expires_at' => now()->subMinute(),
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}/answer", [
                'questionId' => $question->id,
                'answerText' => 'late',
            ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'Quiz time has expired.');

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}/submit")
            ->assertStatus(403)
            ->assertJsonPath('message', 'Quiz time has expired.');
    }

    public function test_guest_cannot_access_attempt_routes(): void
    {
        $this->postJson('/api/course-offerings/1/quizzes/1/start')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/quizzes/1/attempts')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/quizzes/1/attempts/1')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/quizzes/1/attempts/1/answer')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/quizzes/1/attempts/1/submit')->assertUnauthorized();
    }
}
