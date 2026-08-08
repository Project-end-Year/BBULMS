<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Faculty;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $facultyEngineering = Faculty::firstOrCreate(
            ['code' => 'FOE'],
            ['name' => 'Faculty of Engineering', 'is_active' => true]
        );

        $facultyBusiness = Faculty::firstOrCreate(
            ['code' => 'FOB'],
            ['name' => 'Faculty of Business', 'is_active' => true]
        );

        $facultyLetters = Faculty::firstOrCreate(
            ['code' => 'FOL'],
            ['name' => 'Faculty of Letters', 'is_active' => true]
        );

        $departments = [
            [
                'code' => 'CSE',
                'name' => 'Computer Science and Engineering',
                'description' => 'Software, systems, and computing research.',
                'faculty_id' => $facultyEngineering->id,
            ],
            [
                'code' => 'EEE',
                'name' => 'Electrical and Electronic Engineering',
                'description' => 'Circuits, power, and electronics.',
                'faculty_id' => $facultyEngineering->id,
            ],
            [
                'code' => 'BBA',
                'name' => 'Business Administration',
                'description' => 'Management, finance, and entrepreneurship.',
                'faculty_id' => $facultyBusiness->id,
            ],
            [
                'code' => 'ENG',
                'name' => 'English',
                'description' => 'Language, literature, and communication.',
                'faculty_id' => $facultyLetters->id,
            ],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['code' => $dept['code']],
                array_merge($dept, ['is_active' => true])
            );
        }
    }
}
