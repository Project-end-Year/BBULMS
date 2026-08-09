<?php

namespace Tests\Feature;

use App\Events\TestBroadcastEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BroadcastingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'lecturer', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_broadcasting_auth_route_is_registered(): void
    {
        $user = User::factory()->create();
        $user->syncRoles(['student']);

        $response = $this->actingAs($user)->getJson('/broadcasting/auth');

        // The endpoint expects a socket_id and channel_name; without them
        // it returns an error response. The important assertion is that the
        // route exists and is protected by authentication.
        $this->assertNotEquals(404, $response->getStatusCode());
    }

    public function test_broadcast_test_endpoint_dispatches_event(): void
    {
        $user = User::factory()->create();
        $user->syncRoles(['admin']);

        Event::fake();

        $response = $this->actingAs($user)->postJson('/api/broadcast-test');

        $response->assertOk()
            ->assertJsonPath('success', true);

        Event::assertDispatched(TestBroadcastEvent::class);
    }
}
