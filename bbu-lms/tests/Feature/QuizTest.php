<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QuizTest extends TestCase
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

    private function buildQuestionsPayload(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'prompt' => 'What is the capital of France?',
                'points' => 5,
                'order' => 0,
                'explanation' => 'Paris is the capital.',
                'options' => [
                    ['optionText' => 'Paris', 'isCorrect' => true, 'order' => 0],
                    ['optionText' => 'London', 'isCorrect' => false, 'order' => 1],
                    ['optionText' => 'Berlin', 'isCorrect' => false, 'order' => 2],
                ],
            ],
            [
                'type' => 'true_false',
                'prompt' => 'The earth is flat.',
                'points' => 2,
                'order' => 1,
                'options' => [
                    ['optionText' => 'True', 'isCorrect' => false, 'order' => 0],
                    ['optionText' => 'False', 'isCorrect' => true, 'order' => 1],
                ],
            ],
            [
                'type' => 'short_answer',
                'prompt' => 'Explain polymorphism.',
                'points' => 10,
                'order' => 2,
            ],
        ];
    }

    public function test_lecturer_can_create_quiz_with_questions_and_options(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes",
            [
                'title' => 'Week 3 Quiz',
                'description' => 'Covers week 3 material',
                'type' => 'quiz',
                'timeLimitMinutes' => 30,
                'attemptsAllowed' => 2,
                'shuffleQuestions' => true,
                'showCorrectAnswers' => false,
                'isPublished' => false,
                'passingScorePercentage' => 70,
                'questions' => $this->buildQuestionsPayload(),
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.quiz.title', 'Week 3 Quiz')
            ->assertJsonPath('data.quiz.type', 'quiz')
            ->assertJsonPath('data.quiz.timeLimitMinutes', 30)
            ->assertJsonPath('data.quiz.attemptsAllowed', 2)
            ->assertJsonPath('data.quiz.totalPoints', '17.00')
            ->assertJsonCount(3, 'data.quiz.questions');

        $quizId = $response->json('data.quiz.id');
        $this->assertDatabaseHas('quizzes', ['id' => $quizId, 'total_points' => 17]);
        $this->assertEquals(3, Question::where('quiz_id', $quizId)->count());
    }

    public function test_quiz_total_points_is_recalculated_on_update(): void
    {
        $context = $this->createOfferingContext();
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'total_points' => 0,
        ]);

        $response = $this->actingAs($context['lecturer'])->putJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}",
            [
                'title' => 'Updated Quiz',
                'description' => $quiz->description,
                'type' => $quiz->type,
                'questions' => [
                    [
                        'type' => 'multiple_choice',
                        'prompt' => 'Pick one',
                        'points' => 4,
                        'options' => [
                            ['optionText' => 'A', 'isCorrect' => true],
                            ['optionText' => 'B', 'isCorrect' => false],
                        ],
                    ],
                ],
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.quiz.title', 'Updated Quiz')
            ->assertJsonPath('data.quiz.totalPoints', '4.00')
            ->assertJsonCount(1, 'data.quiz.questions');
    }

    public function test_lecturer_can_delete_quiz(): void
    {
        $context = $this->createOfferingContext();
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
        ]);

        $response = $this->actingAs($context['lecturer'])->deleteJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}"
        );

        $response->assertOk()->assertJsonPath('data.deleted', true);
        $this->assertSoftDeleted('quizzes', ['id' => $quiz->id]);
    }

    public function test_lecturer_can_toggle_publish_status(): void
    {
        $context = $this->createOfferingContext();
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'is_published' => false,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/toggle-published"
        );

        $response->assertOk()
            ->assertJsonPath('data.quiz.isPublished', true);

        $this->assertDatabaseHas('quizzes', ['id' => $quiz->id, 'is_published' => true]);
    }

    public function test_student_cannot_create_or_manage_quiz(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
        ]);

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes", ['title' => 'Bad'])
            ->assertForbidden();

        $this->actingAs($student)
            ->putJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}", ['title' => 'Bad'])
            ->assertForbidden();

        $this->actingAs($student)
            ->deleteJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}")
            ->assertForbidden();

        $this->actingAs($student)
            ->postJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/toggle-published")
            ->assertForbidden();
    }

    public function test_student_can_only_see_published_quizzes(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $published = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'is_published' => true,
            'title' => 'Published Quiz',
        ]);
        Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'is_published' => false,
            'title' => 'Draft Quiz',
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes"
        );

        $response->assertOk()
            ->assertJsonCount(1, 'data.quizzes')
            ->assertJsonPath('data.quizzes.0.title', 'Published Quiz');
    }

    public function test_unenrolled_student_cannot_list_quizzes(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');

        $this->actingAs($student)
            ->getJson("/api/course-offerings/{$context['offering']->id}/quizzes")
            ->assertForbidden();
    }

    public function test_other_lecturer_cannot_manage_quiz(): void
    {
        $context = $this->createOfferingContext();
        $otherLecturer = User::factory()->create()->assignRole('lecturer');
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
        ]);

        $this->actingAs($otherLecturer)
            ->putJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}", ['title' => 'Bad'])
            ->assertForbidden();

        $this->actingAs($otherLecturer)
            ->deleteJson("/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}")
            ->assertForbidden();
    }

    public function test_published_exam_creates_calendar_event(): void
    {
        $context = $this->createOfferingContext();
        $start = now()->addDays(3)->toDateTimeString();
        $end = now()->addDays(3)->addHours(2)->toDateTimeString();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes",
            [
                'title' => 'Midterm Exam',
                'description' => 'Covers chapters 1-5',
                'type' => 'exam',
                'isPublished' => true,
                'startsAt' => $start,
                'endsAt' => $end,
            ]
        );

        $response->assertCreated();
        $quizId = $response->json('data.quiz.id');

        $this->assertDatabaseHas('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quizId,
            'type' => 'exam',
            'course_offering_id' => $context['offering']->id,
        ]);
    }

    public function test_unpublished_exam_does_not_create_calendar_event(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes",
            [
                'title' => 'Draft Exam',
                'type' => 'exam',
                'isPublished' => false,
                'startsAt' => now()->addDays(3)->toDateTimeString(),
            ]
        );

        $response->assertCreated();
        $quizId = $response->json('data.quiz.id');

        $this->assertDatabaseMissing('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quizId,
        ]);
    }

    public function test_practice_quiz_does_not_create_calendar_event(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes",
            [
                'title' => 'Practice Quiz',
                'type' => 'practice',
                'isPublished' => true,
                'startsAt' => now()->addDays(3)->toDateTimeString(),
            ]
        );

        $response->assertCreated();
        $quizId = $response->json('data.quiz.id');

        $this->assertDatabaseMissing('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quizId,
        ]);
    }

    public function test_publishing_exam_creates_calendar_event_and_unpublishing_removes_it(): void
    {
        $context = $this->createOfferingContext();
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'type' => 'exam',
            'is_published' => false,
            'starts_at' => now()->addDays(2),
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/toggle-published"
        )->assertOk();

        $this->assertDatabaseHas('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quiz->id,
            'type' => 'exam',
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}/toggle-published"
        )->assertOk();

        $this->assertDatabaseMissing('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quiz->id,
        ]);
    }

    public function test_deleting_exam_removes_calendar_event(): void
    {
        $context = $this->createOfferingContext();
        $quiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'type' => 'exam',
            'is_published' => true,
            'starts_at' => now()->addDays(2),
        ]);
        CalendarEvent::factory()->create([
            'source_type' => 'quiz',
            'source_id' => $quiz->id,
            'course_offering_id' => $context['offering']->id,
            'type' => 'exam',
            'title' => $quiz->title,
            'start_at' => $quiz->starts_at,
            'created_by' => $context['lecturer']->id,
        ]);

        $this->actingAs($context['lecturer'])->deleteJson(
            "/api/course-offerings/{$context['offering']->id}/quizzes/{$quiz->id}"
        )->assertOk();

        $this->assertDatabaseMissing('calendar_events', [
            'source_type' => 'quiz',
            'source_id' => $quiz->id,
        ]);
    }

    public function test_guest_cannot_access_quiz_routes(): void
    {
        $this->getJson('/api/course-offerings/1/quizzes')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/quizzes')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/quizzes/1')->assertUnauthorized();
        $this->putJson('/api/course-offerings/1/quizzes/1')->assertUnauthorized();
        $this->deleteJson('/api/course-offerings/1/quizzes/1')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/quizzes/1/toggle-published')->assertUnauthorized();
    }
}
