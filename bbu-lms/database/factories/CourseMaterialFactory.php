<?php

namespace Database\Factories;

use App\Models\CourseMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseMaterial>
 */
class CourseMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_offering_id' => null,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'file_path' => null,
            'file_name' => null,
            'file_size' => null,
            'mime_type' => null,
            'external_url' => fake()->optional()->url(),
            'type' => fake()->randomElement(['file', 'link', 'video']),
            'uploaded_by' => null,
            'is_published' => true,
            'published_at' => now(),
            'order' => fake()->numberBetween(0, 10),
            'is_active' => true,
        ];
    }
}
