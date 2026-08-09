<?php

namespace Database\Factories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => null,
            'title' => fake()->sentence(6),
            'content' => fake()->paragraphs(2, true),
            'posted_by' => null,
            'is_pinned' => fake()->boolean(20),
            'is_published' => true,
            'published_at' => now(),
            'is_active' => true,
        ];
    }
}
