<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            ['code' => 'CS101', 'name' => 'Introduction to Programming', 'credits' => 3, 'dept' => 'CSE'],
            ['code' => 'CS201', 'name' => 'Data Structures and Algorithms', 'credits' => 3, 'dept' => 'CSE'],
            ['code' => 'CS301', 'name' => 'Database Systems', 'credits' => 3, 'dept' => 'CSE'],
            ['code' => 'EE101', 'name' => 'Circuit Analysis', 'credits' => 3, 'dept' => 'EEE'],
            ['code' => 'BBA101', 'name' => 'Principles of Management', 'credits' => 3, 'dept' => 'BBA'],
            ['code' => 'ENG101', 'name' => 'Academic Writing', 'credits' => 2, 'dept' => 'ENG'],
        ];

        foreach ($courses as $course) {
            $department = Department::where('code', $course['dept'])->first();

            Course::firstOrCreate(
                ['code' => $course['code']],
                [
                    'name' => $course['name'],
                    'credits' => $course['credits'],
                    'department_id' => $department?->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
