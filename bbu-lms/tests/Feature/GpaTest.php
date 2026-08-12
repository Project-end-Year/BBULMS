<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\GradeComponent;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use App\Services\GpaCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GpaTest extends TestCase
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
            'credits' => 3,
        ]);
        $lecturer = User::factory()->create()->assignRole('lecturer');
        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        return compact('course', 'lecturer', 'offering', 'semester');
    }

    public function test_gpa_calculator_maps_letters_to_points(): void
    {
        $calculator = app(GpaCalculator::class);

        $this->assertEquals(4.0, $calculator->letterToPoints('A'));
        $this->assertEquals(3.0, $calculator->letterToPoints('B'));
        $this->assertEquals(2.0, $calculator->letterToPoints('C'));
        $this->assertEquals(1.0, $calculator->letterToPoints('D'));
        $this->assertEquals(0.0, $calculator->letterToPoints('F'));
        $this->assertNull($calculator->letterToPoints(null));
    }

    public function test_student_can_view_grade_history(): void
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
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => GradeComponent::query()->first()->id,
                'points' => 90,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $response = $this->actingAs($student)->getJson('/api/grade-history');

        $response->assertOk()
            ->assertJsonPath('data.semesters.0.courses.0.letterGrade', 'A')
            ->assertJsonPath('data.semesters.0.gpa', 4)
            ->assertJsonPath('data.cumulativeGpa', 4)
            ->assertJsonPath('data.cumulativeCredits', 3);
    }

    public function test_grade_history_summary_returns_current_semester(): void
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
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => GradeComponent::query()->first()->id,
                'points' => 80,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $response = $this->actingAs($student)->getJson(
            "/api/grade-history/summary?semesterId={$context['semester']->id}"
        );

        $response->assertOk()
            ->assertJsonPath('data.courses.0.letterGrade', 'B')
            ->assertJsonPath('data.gpa', 3)
            ->assertJsonPath('data.cumulativeGpa', 3);
    }

    public function test_lecturer_can_view_student_grade_history(): void
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
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $this->actingAs($context['lecturer'])->postJson(
            "/api/course-offerings/{$context['offering']->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => GradeComponent::query()->first()->id,
                'points' => 70,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $response = $this->actingAs($context['lecturer'])->getJson("/api/students/{$student->id}/grade-history");

        $response->assertOk()
            ->assertJsonPath('data.student.id', $student->id)
            ->assertJsonPath('data.semesters.0.courses.0.letterGrade', 'C')
            ->assertJsonPath('data.cumulativeGpa', 2);
    }

    public function test_student_cannot_view_other_student_history(): void
    {
        $context = $this->createOfferingContext();
        $student = User::factory()->create()->assignRole('student');
        $other = User::factory()->create()->assignRole('student');

        $response = $this->actingAs($student)->getJson("/api/students/{$other->id}/grade-history");

        $response->assertForbidden();
    }

    public function test_cumulative_gpa_weights_by_credits(): void
    {
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);
        $semester = Semester::factory()->create();
        $lecturer = User::factory()->create()->assignRole('lecturer');
        $student = User::factory()->create()->assignRole('student');

        $courseA = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
            'credits' => 4,
        ]);
        $courseB = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
            'credits' => 2,
        ]);

        $offeringA = CourseOffering::factory()->create([
            'course_id' => $courseA->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);
        $offeringB = CourseOffering::factory()->create([
            'course_id' => $courseB->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
        ]);

        Enrollment::factory()->create([
            'course_offering_id' => $offeringA->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);
        Enrollment::factory()->create([
            'course_offering_id' => $offeringB->id,
            'student_id' => $student->id,
            'status' => 'enrolled',
        ]);

        $componentA = GradeComponent::factory()->create([
            'course_offering_id' => $offeringA->id,
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);
        $componentB = GradeComponent::factory()->create([
            'course_offering_id' => $offeringB->id,
            'name' => 'Final',
            'type' => 'final',
            'weight' => 100,
        ]);

        $this->actingAs($lecturer)->postJson(
            "/api/course-offerings/{$offeringA->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => $componentA->id,
                'points' => 100,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $this->actingAs($lecturer)->postJson(
            "/api/course-offerings/{$offeringB->id}/grades",
            [
                'studentId' => $student->id,
                'componentId' => $componentB->id,
                'points' => 80,
                'maxPoints' => 100,
            ]
        )->assertOk();

        $response = $this->actingAs($student)->getJson('/api/grade-history');

        // (4*4.0 + 2*3.0) / 6 = 22/6 = 3.67
        $response->assertOk()
            ->assertJsonPath('data.cumulativeCredits', 6)
            ->assertJsonPath('data.cumulativeGpa', 3.67);
    }

    public function test_guest_cannot_access_grade_history(): void
    {
        $this->getJson('/api/grade-history')->assertUnauthorized();
        $this->getJson('/api/grade-history/summary')->assertUnauthorized();
        $this->getJson('/api/students/1/grade-history')->assertUnauthorized();
    }
}
