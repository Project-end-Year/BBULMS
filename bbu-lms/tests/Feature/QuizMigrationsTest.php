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

class QuizMigrationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function createOffering(): CourseOffering
    {
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);
        $semester = Semester::factory()->create();
        $course = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
        ]);
        $lecturer = User::factory()->create()->assignRole('lecturer');

        return CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);
    }

    private function createQuiz(): Quiz
    {
        $offering = $this->createOffering();
        $lecturer = $offering->lecturer;

        return Quiz::factory()->create([
            'course_offering_id' => $offering->id,
            'created_by' => $lecturer->id,
        ]);
    }

    public function test_quiz_factory_and_relations_work(): void
    {
        $offering = $this->createOffering();
        $lecturer = $offering->lecturer;

        $quiz = Quiz::factory()->create([
            'course_offering_id' => $offering->id,
            'created_by' => $lecturer->id,
        ]);

        $this->assertDatabaseHas('quizzes', ['id' => $quiz->id]);
        $this->assertEquals($offering->id, $quiz->courseOffering->id);
        $this->assertEquals($lecturer->id, $quiz->creator->id);
        $this->assertTrue($quiz->questions()->exists() === false);
    }

    public function test_question_factory_and_options_work(): void
    {
        $quiz = $this->createQuiz();

        $mc = Question::factory()->multipleChoice()->create(['quiz_id' => $quiz->id, 'points' => 5]);
        $tf = Question::factory()->trueFalse()->create(['quiz_id' => $quiz->id, 'points' => 2]);
        $sa = Question::factory()->shortAnswer()->create(['quiz_id' => $quiz->id, 'points' => 10]);

        QuestionOption::factory()->correct()->create(['question_id' => $mc->id, 'order' => 0]);
        QuestionOption::factory()->count(3)->create(['question_id' => $mc->id]);

        QuestionOption::factory()->correct()->create(['question_id' => $tf->id]);

        $this->assertEquals(3, $quiz->questions()->count());
        $this->assertEquals(4, $mc->options->count());
        $this->assertEquals(1, $mc->correctOptions->count());
        $this->assertEquals('multiple_choice', $mc->type);
        $this->assertEquals('true_false', $tf->type);
        $this->assertEquals('short_answer', $sa->type);
    }

    public function test_quiz_attempt_and_answers_factory_work(): void
    {
        $quiz = $this->createQuiz();
        $student = User::factory()->create()->assignRole('student');

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
        ]);

        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        $option = QuestionOption::factory()->correct()->create(['question_id' => $question->id]);

        $answer = QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'question_option_id' => $option->id,
            'points_awarded' => 5,
            'points_possible' => 5,
            'is_correct' => true,
            'status' => 'correct',
        ]);

        $this->assertEquals($quiz->id, $attempt->quiz->id);
        $this->assertEquals($student->id, $attempt->student->id);
        $this->assertEquals($attempt->id, $answer->attempt->id);
        $this->assertEquals($question->id, $answer->question->id);
        $this->assertEquals($option->id, $answer->option->id);
    }

    public function test_attempt_number_is_unique_per_quiz_and_student(): void
    {
        $quiz = $this->createQuiz();
        $student = User::factory()->create()->assignRole('student');

        QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'attempt_number' => 1,
        ]);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'attempt_number' => 1,
        ]);
    }

    public function test_quiz_soft_delete_cascades_questions(): void
    {
        $quiz = $this->createQuiz();
        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        QuestionOption::factory()->count(2)->create(['question_id' => $question->id]);

        $quiz->delete();

        $this->assertSoftDeleted('quizzes', ['id' => $quiz->id]);
        $this->assertSoftDeleted('questions', ['id' => $question->id]);
    }

    public function test_course_offering_has_quizzes_relation(): void
    {
        $offering = $this->createOffering();
        $lecturer = $offering->lecturer;
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $offering->id,
            'created_by' => $lecturer->id,
        ]);

        $this->assertTrue($offering->quizzes->contains('id', $quiz->id));
    }
}
