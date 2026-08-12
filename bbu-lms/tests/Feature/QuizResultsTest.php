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

class QuizResultsTest extends TestCase
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
            'passing_score_percentage' => 60,
            'show_correct_answers' => true,
        ]);

        $mc = Question::factory()->multipleChoice()->create([
            'quiz_id' => $quiz->id,
            'points' => 6,
        ]);
        $correctMc = QuestionOption::factory()->correct()->create([
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
            'points' => 4,
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

        return $quiz;
    }

    public function test_lecturer_can_view_class_results(): void
    {
        $context = $this->createOfferingContext();
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $studentA = User::factory()->create()->assignRole('student');
        $studentB = User::factory()->create()->assignRole('student');
        foreach ([$studentA, $studentB] as $student) {
            Enrollment::factory()->create([
                'course_offering_id' => $context['offering']->id,
                'student_id' => $student->id,
                'status' => 'enrolled',
            ]);
        }

        $attemptA = QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $studentA->id,
            'score' => 10,
            'max_score' => 10,
            'percentage' => 100,
        ]);
        $mcQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'multiple_choice')->first();
        $correctMcOption = QuestionOption::query()->where('question_id', $mcQuestion->id)->where('is_correct', true)->first();
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attemptA->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => $correctMcOption->id,
            'is_correct' => true,
            'points_awarded' => 6,
            'status' => 'correct',
        ]);

        $attemptB = QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $studentB->id,
            'score' => 4,
            'max_score' => 10,
            'percentage' => 40,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attemptB->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => null,
            'is_correct' => false,
            'points_awarded' => 0,
            'status' => 'incorrect',
        ]);

        $response = $this->actingAs($context['lecturer'])->getJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/results"
        );

        $response->assertOk()
            ->assertJsonPath('data.stats.totalAttempts', 2)
            ->assertJsonPath('data.stats.averageScore', 70)
            ->assertJsonPath('data.stats.highestScore', 100)
            ->assertJsonPath('data.stats.lowestScore', 40)
            ->assertJsonPath('data.stats.passingCount', 1)
            ->assertJsonCount(5, 'data.histogram')
            ->assertJsonCount(2, 'data.questionStats')
            ->assertJsonCount(2, 'data.attempts');
    }

    public function test_student_cannot_view_class_results(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $this->actingAs($student)
            ->getJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/results")
            ->assertForbidden();
    }

    public function test_other_lecturer_cannot_view_class_results(): void
    {
        $context = $this->createOfferingContext();
        $otherLecturer = User::factory()->create()->assignRole('lecturer');
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $this->actingAs($otherLecturer)
            ->getJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/results")
            ->assertForbidden();
    }

    public function test_student_can_view_own_completed_attempt_breakdown(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = $this->createPublishedQuiz($context['offering'], $context['lecturer']);

        $mcQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'multiple_choice')->first();
        $correctMcOption = QuestionOption::query()->where('question_id', $mcQuestion->id)->where('is_correct', true)->first();
        $tfQuestion = Question::query()->where('quiz_id', $quiz->id)->where('type', 'true_false')->first();
        $correctTfOption = QuestionOption::query()->where('question_id', $tfQuestion->id)->where('is_correct', true)->first();

        $attempt = QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'score' => 10,
            'max_score' => 10,
            'percentage' => 100,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => $correctMcOption->id,
            'is_correct' => true,
            'points_awarded' => 6,
            'status' => 'correct',
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $tfQuestion->id,
            'question_option_id' => $correctTfOption->id,
            'is_correct' => true,
            'points_awarded' => 4,
            'status' => 'correct',
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/attempts/{$attempt->id}"
        );

        $response->assertOk()
            ->assertJsonPath('data.attempt.status', 'completed')
            ->assertJsonPath('data.attempt.percentage', 100)
            ->assertJsonPath('data.quiz.questions.0.options.0.isCorrect', true)
            ->assertJsonPath('data.answers.0.isCorrect', true);
    }

    public function test_guest_cannot_view_results(): void
    {
        $this->getJson('/api/course-offerings/1/quizzes/1/results')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/quizzes/1/attempts/1')->assertUnauthorized();
    }
}
