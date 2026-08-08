<?php

namespace Database\Seeders;

use App\Models\Department;
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
        $departments = [
            ['code' => 'CSE', 'name' => 'Computer Science and Engineering', 'description' => 'Software, systems, and computing research.'],
            ['code' => 'EEE', 'name' => 'Electrical and Electronic Engineering', 'description' => 'Circuits, power, and electronics.'],
            ['code' => 'BBA', 'name' => 'Business Administration', 'description' => 'Management, finance, and entrepreneurship.'],
            ['code' => 'ENG', 'name' => 'English', 'description' => 'Language, literature, and communication.'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['code' => $dept['code']],
                array_merge($dept, ['is_active' => true])
            );
        }
    }
}
