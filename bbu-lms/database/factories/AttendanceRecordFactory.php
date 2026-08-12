<?php

namespace Database\Factories;

use App\Models\AttendanceRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceRecord>
 */
class AttendanceRecordFactory extends Factory
{
    protected $model = AttendanceRecord::class;

    public function definition(): array
    {
        return [
            'attendance_session_id' => null,
            'student_id' => null,
            'status' => $this->faker->randomElement(['present', 'late', 'absent', 'excused']),
            'checked_in_at' => null,
            'latitude' => null,
            'longitude' => null,
            'check_in_method' => null,
        ];
    }
}
