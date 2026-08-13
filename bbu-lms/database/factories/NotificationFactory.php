<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(Notification::types()),
            'title' => $this->faker->sentence(5),
            'body' => $this->faker->optional()->paragraph(),
            'data' => null,
            'action_url' => $this->faker->optional()->url(),
            'read_at' => null,
        ];
    }
}
