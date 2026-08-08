<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoursesMigrationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_faculty_can_be_created_and_links_to_departments(): void
    {
        $faculty = Faculty::factory()->create();
        $department = Department::factory()->create([
            'faculty_id' => $faculty->id,
        ]);

        $this->assertDatabaseHas('departments', [
            'id' => $department->id,
            'faculty_id' => $faculty->id,
        ]);

        $this->assertTrue($department->fresh()->faculty->is($faculty));
        $this->assertTrue($faculty->fresh()->departments->contains($department));
    }

    public function test_course_can_be_created_with_department_and_program(): void
    {
        $department = Department::factory()->create();
        $program = Program::factory()->create(['department_id' => $department->id]);

        $course = Course::factory()->create([
            'department_id' => $department->id,
            'program_id' => $program->id,
        ]);

        $this->assertTrue($course->fresh()->department->is($department));
        $this->assertTrue($course->fresh()->program->is($program));
        $this->assertTrue($department->fresh()->courses->contains($course));
    }

    public function test_course_offering_can_be_created_with_relations(): void
    {
        $course = Course::factory()->create();
        $semester = Semester::factory()->create([
            'start_date' => now(),
            'end_date' => now()->addMonths(4),
        ]);
        $lecturer = User::factory()->create();

        $offering = CourseOffering::factory()->create([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
            'lecturer_id' => $lecturer->id,
            'schedule' => ['days' => ['Mon', 'Wed'], 'start' => '08:00', 'end' => '10:00'],
        ]);

        $this->assertTrue($offering->fresh()->course->is($course));
        $this->assertTrue($offering->fresh()->semester->is($semester));
        $this->assertTrue($offering->fresh()->lecturer->is($lecturer));
        $this->assertTrue($course->fresh()->offerings->contains($offering));
        $this->assertTrue($lecturer->fresh()->taughtOfferings->contains($offering));
    }

    public function test_enrollment_prevents_duplicates(): void
    {
        $offering = CourseOffering::factory()
            ->for(Course::factory())
            ->for(Semester::factory(['start_date' => now(), 'end_date' => now()->addMonths(4)]))
            ->create();
        $student = User::factory()->create();

        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
        ]);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

        Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
        ]);
    }

    public function test_enrollment_relations(): void
    {
        $offering = CourseOffering::factory()
            ->for(Course::factory())
            ->for(Semester::factory(['start_date' => now(), 'end_date' => now()->addMonths(4)]))
            ->create();
        $student = User::factory()->create();

        $enrollment = Enrollment::factory()->create([
            'course_offering_id' => $offering->id,
            'student_id' => $student->id,
        ]);

        $this->assertTrue($enrollment->fresh()->courseOffering->is($offering));
        $this->assertTrue($enrollment->fresh()->student->is($student));
        $this->assertTrue($student->fresh()->enrollments->contains($enrollment));
        $this->assertTrue($offering->fresh()->enrollments->contains($enrollment));
    }
}
