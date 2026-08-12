<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\GradeComponent;
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

class GradeTest extends TestCase
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

    public function test_lecturer_can_create_grade_component(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grade-components",
            [
                'name' => 'Midterm Exam',
                'type' => 'midterm',
                'weight' => 30,
                'order' => 1,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.component.name', 'Midterm Exam')
            ->assertJsonPath('data.component.weight', '30.00');
    }

    public function test_component_weight_cannot_exceed_100_percent(): void
    {
        $context = $this->createOfferingContext();
        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'weight' => 70,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grade-components",
            [
                'name' => 'Final Exam',
                'type' => 'final',
                'weight' => 40,
            ]
        );

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Total component weight cannot exceed 100%.');
    }

    public function test_student_cannot_create_grade_component(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/grade-components",
            [
                'name' => 'Project',
                'type' => 'custom',
                'weight' => 20,
            ]
        );

        $response->assertForbidden();
    }

    public function test_student_can_view_own_grades(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Assignments',
            'type' => 'assignment',
            'weight' => 50,
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/me"
        );

        $response->assertOk()
            ->assertJsonPath('data.totalWeight', 0)
            ->assertJsonCount(1, 'data.breakdown');
    }

    public function test_assignment_grades_are_calculated_correctly(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Assignments',
            'type' => 'assignment',
            'weight' => 50,
        ]);
        $assignment = Assignment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'max_points' => 100,
        ]);
        AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'grade' => 85,
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/me"
        );

        $response->assertOk()
            ->assertJsonPath('data.breakdown.0.percentage', 85)
            ->assertJsonPath('data.breakdown.0.weighted', 42.5)
            ->assertJsonPath('data.overall', 85)
            ->assertJsonPath('data.letterGrade', 'B');
    }

    public function test_attendance_grades_are_calculated_correctly(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Participation',
            'type' => 'attendance',
            'weight' => 20,
        ]);

        $sessionOne = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);
        $sessionTwo = AttendanceSession::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'lecturer_id' => $context['lecturer']->id,
        ]);

        AttendanceRecord::factory()->create([
            'attendance_session_id' => $sessionOne->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);
        AttendanceRecord::factory()->create([
            'attendance_session_id' => $sessionTwo->id,
            'student_id' => $student->id,
            'status' => 'absent',
        ]);

        $response = $this->actingAs($context['lecturer'])->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/students/{$student->id}"
        );

        $response->assertOk()
            ->assertJsonPath('data.breakdown.0.percentage', 50)
            ->assertJsonPath('data.breakdown.0.weighted', 10)
            ->assertJsonPath('data.overall', 50)
            ->assertJsonPath('data.letterGrade', 'F');
    }

    public function test_lecturer_can_enter_manual_grade(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Midterm',
            'type' => 'midterm',
            'weight' => 30,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => $component->id,
                'points' => 45,
                'maxPoints' => 50,
                'feedback' => 'Well done',
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.grade.percentage', '90.00')
            ->assertJsonPath('data.grade.letterGrade', 'A')
            ->assertJsonPath('data.grade.feedback', 'Well done');
    }

    public function test_manual_grade_overall_is_recalculated(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        $component = GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => $component->id,
                'points' => 75,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/me"
        );

        $response->assertOk()
            ->assertJsonPath('data.overall', 75)
            ->assertJsonPath('data.letterGrade', 'C');
    }

    public function test_recalculate_endpoint_updates_all_enrolled_students(): void
    {
        $context = $this->createOfferingContext();
        $studentOne = User::factory()->create()->assignRole('student');
        $studentTwo = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $studentOne->id,
            'status' => 'enrolled',
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $studentTwo->id,
            'status' => 'enrolled',
        ]);
        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades/recalculate"
        );

        $response->assertOk()
            ->assertJsonPath('data.recalculated', 2);
    }

    public function test_student_cannot_recalculate_grades(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($student)->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades/recalculate"
        );

        $response->assertForbidden();
    }

    public function test_lecturer_can_create_quiz_grade_component(): void
    {
        $context = $this->createOfferingContext();

        $response = $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grade-components",
            [
                'name' => 'Quizzes',
                'type' => 'quiz',
                'weight' => 20,
                'order' => 2,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.component.name', 'Quizzes')
            ->assertJsonPath('data.component.type', 'quiz')
            ->assertJsonPath('data.component.weight', '20.00');
    }

    public function test_quiz_grades_are_calculated_from_completed_attempts(): void
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
            'is_published' => true,
            'total_points' => 10,
        ]);

        $mcQuestion = Question::factory()->multipleChoice()->create([
            'quiz_id' => $quiz->id,
            'points' => 10,
        ]);
        $correctOption = QuestionOption::factory()->correct()->create([
            'question_id' => $mcQuestion->id,
            'option_text' => 'Correct',
            'order' => 0,
        ]);

        $attempt = QuizAttempt::factory()->completed()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'score' => 8,
            'max_score' => 10,
            'percentage' => 80,
        ]);
        QuizAnswer::factory()->create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $mcQuestion->id,
            'question_option_id' => $correctOption->id,
            'is_correct' => true,
            'points_awarded' => 8,
            'status' => 'correct',
        ]);

        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Quiz Average',
            'type' => 'quiz',
            'weight' => 20,
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/me"
        );

        $response->assertOk()
            ->assertJsonPath('data.breakdown.0.percentage', 80)
            ->assertJsonPath('data.breakdown.0.weighted', 16)
            ->assertJsonPath('data.overall', 80)
            ->assertJsonPath('data.letterGrade', 'B');
    }

    public function test_quiz_component_ignores_unpublished_quizzes_and_incomplete_attempts(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        Enrollment::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $draftQuiz = Quiz::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'created_by' => $context['lecturer']->id,
            'is_published' => false,
            'total_points' => 10,
        ]);

        QuizAttempt::factory()->completed()->create([
            'quiz_id' => $draftQuiz->id,
            'student_id' => $student->id,
            'percentage' => 90,
        ]);

        GradeComponent::factory()->create([
            'course_offering_id' => $context['offering']->id,
            'name' => 'Quizzes',
            'type' => 'quiz',
            'weight' => 20,
        ]);

        $response = $this->actingAs($student)->getJson(
            "/api/course-offerings/{$context['offering']->id}/grades/me"
        );

        $response->assertOk()
            ->assertJsonPath('data.totalWeight', 0)
            ->assertJsonPath('data.overall', null);
    }

    public function test_guest_cannot_access_grade_routes(): void
    {
        $this->getJson('/api/course-offerings/1/grade-components')->assertUnauthorized();
        $this->postJson('/api/course-offerings/1/grade-components')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/grades')->assertUnauthorized();
        $this->getJson('/api/course-offerings/1/grades/me')->assertUnauthorized();
    }
}
