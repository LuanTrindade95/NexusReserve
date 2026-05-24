<?php

use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceType;
use App\Models\User;
use App\Notifications\ReservationDecisionNotification;
use App\Notifications\ReservationPendingApprovalNotification;
use App\States\Reservations\Approved;
use App\States\Reservations\Pending;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function realtimeResource(): Resource
{
    $type = ResourceType::factory()->create([
        'requires_approval' => true,
        'max_duration_minutes' => 240,
    ]);

    return Resource::factory()
        ->for($type)
        ->create(['status' => 'active']);
}

it('queues notifications for pending approvals and owner decisions', function () {
    config(['broadcasting.default' => 'null']);
    Notification::fake();

    $manager = User::factory()->create();
    $manager->assignRole('manager');
    $requester = User::factory()->create();
    $requester->assignRole('requester');
    $reservation = Reservation::factory()
        ->for(realtimeResource())
        ->for($requester)
        ->create(['status' => 'draft']);

    $reservation->status->transitionTo(Pending::class, $requester->id, 'Ready for review');

    Notification::assertSentTo($manager, ReservationPendingApprovalNotification::class, function ($notification) {
        expect($notification)->toBeInstanceOf(ShouldQueue::class);

        return true;
    });

    $reservation->refresh();
    $reservation->status->transitionTo(Approved::class, $manager->id, 'Approved for use');

    Notification::assertSentTo($requester, ReservationDecisionNotification::class, function ($notification) {
        expect($notification)->toBeInstanceOf(ShouldQueue::class);

        return true;
    });
});

it('denies private resource channel access to users without view-all or resource manage permission', function () {
    $requester = User::factory()->create();
    $requester->assignRole('requester');
    $resource = realtimeResource();
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');

    $this->withToken($requester->createToken('test')->plainTextToken)->postJson('/broadcasting/auth', [
        'socket_id' => '123.456',
        'channel_name' => "private-resources.{$resource->id}",
    ])->assertForbidden();
});

it('authorizes managers to join the reservations presence channel', function () {
    $manager = User::factory()->create();
    $manager->assignRole('manager');
    expect($manager->hasPermissionTo('reservations.approve', 'web'))->toBeTrue();
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');

    $this->withToken($manager->createToken('test')->plainTextToken)->postJson('/broadcasting/auth', [
        'socket_id' => '123.456',
        'channel_name' => 'presence-managers.reservations',
    ])
        ->assertOk()
        ->assertSee('channel_data');
});

it('lists and marks authenticated user notifications as read', function () {
    config(['broadcasting.default' => 'null']);

    $manager = User::factory()->create();
    $manager->assignRole('manager');
    $requester = User::factory()->create();
    $requester->assignRole('requester');
    $reservation = Reservation::factory()
        ->for(realtimeResource())
        ->for($requester)
        ->create(['status' => 'draft']);

    $reservation->status->transitionTo(Pending::class, $requester->id, 'Ready for review');
    $notification = $manager->notifications()->firstOrFail();
    $token = $manager->createToken('test')->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.0.id', $notification->id)
        ->assertJsonPath('data.0.read_at', null);

    $this->withToken($token)->postJson("/api/v1/notifications/{$notification->id}/read")
        ->assertOk();

    expect($manager->notifications()->whereKey($notification->id)->first()?->read_at)->not->toBeNull();
});
