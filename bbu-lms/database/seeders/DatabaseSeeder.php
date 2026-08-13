<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            SemesterSeeder::class,
            CourseSeeder::class,
            DemoSeeder::class,
        ]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@bbu.edu'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles(['admin']);

        $test = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $test->syncRoles(['student']);
    }
}
