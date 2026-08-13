<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\ClassSchedule;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a realistic demo environment for development and stakeholder demos.
     */
    public function run(): void
    {
        $semester = Semester::firstOrCreate(
            ['name' => 'Fall 2026'],
            [
                'start_date' => now()->subWeek(),
                'end_date' => now()->addMonths(4),
                'is_active' => true,
            ]
        );

        $departments = Department::all()->keyBy('code');

        $programs = [
            ['code' => 'BSCSE', 'name' => 'BS in Computer Science and Engineering', 'dept' => 'CSE', 'years' => 4],
            ['code' => 'BSEEE', 'name' => 'BS in Electrical and Electronic Engineering', 'dept' => 'EEE', 'years' => 4],
            ['code' => 'BBA', 'name' => 'Bachelor of Business Administration', 'dept' => 'BBA', 'years' => 4],
            ['code' => 'BAENG', 'name' => 'BA in English', 'dept' => 'ENG', 'years' => 4],
        ];

        foreach ($programs as $program) {
            Program::firstOrCreate(
                ['code' => $program['code']],
                [
                    'name' => $program['name'],
                    'department_id' => $departments[$program['dept']]?->id,
                    'duration_years' => $program['years'],
                    'is_active' => true,
                ]
            );
        }

        $lecturers = [
            ['name' => 'Dr. Sophea Lim', 'email' => 'sophea.lim@bbu.edu', 'roles' => ['lecturer']],
            ['name' => 'Prof. Dara Penh', 'email' => 'dara.penh@bbu.edu', 'roles' => ['lecturer']],
            ['name' => 'Dr. Kimheng Sok', 'email' => 'kimheng.sok@bbu.edu', 'roles' => ['lecturer']],
        ];

        $lecturerModels = [];
        foreach ($lecturers as $lecturer) {
            $user = User::firstOrCreate(
                ['email' => $lecturer['email']],
                [
                    'name' => $lecturer['name'],
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            $user->syncRoles($lecturer['roles']);
            $lecturerModels[] = $user;
        }

        $studentNames = [
            'Sokha Chan',
            'Vanna Mao',
            'Rithy Nguon',
            'Bopha Phan',
            'Chanthou Thai',
            'Kosal Yim',
            'Malis Heng',
            'Ponlok Keo',
        ];

        $studentModels = [];
        foreach ($studentNames as $index => $name) {
            $email = 'student'.($index + 1).'@bbu.edu';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            $user->syncRoles(['student']);
            $studentModels[] = $user;
        }

        $courses = Course::all()->keyBy('code');

        $offerings = [
            ['course' => 'CS101', 'lecturer' => 0, 'section' => 'A', 'room' => 'A-101'],
            ['course' => 'CS201', 'lecturer' => 0, 'section' => 'A', 'room' => 'A-102'],
            ['course' => 'CS301', 'lecturer' => 0, 'section' => 'B', 'room' => 'B-201'],
            ['course' => 'EE101', 'lecturer' => 1, 'section' => 'A', 'room' => 'C-101'],
            ['course' => 'BBA101', 'lecturer' => 2, 'section' => 'A', 'room' => 'D-101'],
            ['course' => 'ENG101', 'lecturer' => 2, 'section' => 'A', 'room' => 'E-101'],
        ];

        $offeringModels = [];
        foreach ($offerings as $offering) {
            $course = $courses[$offering['course']];
            $lecturer = $lecturerModels[$offering['lecturer']];

            $model = CourseOffering::firstOrCreate(
                [
                    'course_id' => $course->id,
                    'semester_id' => $semester->id,
                    'section' => $offering['section'],
                ],
                [
                    'lecturer_id' => $lecturer->id,
                    'capacity' => 40,
                    'room' => $offering['room'],
                    'is_active' => true,
                ]
            );

            $offeringModels[] = $model;
        }

        foreach ($studentModels as $student) {
            foreach ($offeringModels as $offering) {
                Enrollment::firstOrCreate(
                    [
                        'course_offering_id' => $offering->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'status' => 'enrolled',
                        'enrolled_at' => now()->subDays(rand(1, 30)),
                    ]
                );
            }
        }

        foreach ($offeringModels as $offering) {
            ClassSchedule::firstOrCreate(
                [
                    'course_offering_id' => $offering->id,
                    'day_of_week' => 'Mon',
                    'start_time' => '08:00:00',
                ],
                [
                    'end_time' => '10:00:00',
                    'room' => $offering->room,
                    'type' => 'lecture',
                    'is_active' => true,
                ]
            );

            ClassSchedule::firstOrCreate(
                [
                    'course_offering_id' => $offering->id,
                    'day_of_week' => 'Wed',
                    'start_time' => '08:00:00',
                ],
                [
                    'end_time' => '10:00:00',
                    'room' => $offering->room,
                    'type' => 'lecture',
                    'is_active' => true,
                ]
            );

            Assignment::firstOrCreate(
                [
                    'course_offering_id' => $offering->id,
                    'title' => 'Assignment 1',
                ],
                [
                    'created_by' => $offering->lecturer_id,
                    'description' => 'First assignment for the semester.',
                    'due_at' => now()->addWeeks(2),
                    'max_points' => 100,
                    'is_published' => true,
                ]
            );
        }

        $this->command->info('Demo data seeded successfully.');
        $this->command->info('Default accounts: admin@bbu.edu / password, student1@bbu.edu / password, sophea.lim@bbu.edu / password');
    }
}
