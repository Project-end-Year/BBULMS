<?php

namespace Database\Factories;

use App\Models\AttendanceSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    protected $model = AttendanceSession::class;

    public function definition(): array
    {
        $starts = $this->faker->dateTimeBetween('-1 week', '+1 week');

        return [
            'course_offering_id' => null,
            'lecturer_id' => null,
            'title' => $this->faker->optional(0.7)->sentence(3),
            'starts_at' => $starts,
            'ends_at' => (clone $starts)->modify('+2 hours'),
            'code' => strtoupper($this->faker->bothify('??####')),
            'qr_token' => $this->faker->uuid(),
            'is_active' => true,
            'late_threshold_minutes' => 15,
            'closed_at' => null,
        ];
    }
}
