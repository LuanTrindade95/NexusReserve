<?php

use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceBlackout;
use App\Models\ResourceType;
use App\Models\User;
use App\States\Reservations\Pending;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    config(['audit.console' => true]);
});

function actingReservationUser(string $role = 'requester'): User
{
    $user = User::factory()->create();
    $user->assignRole($role);
    Sanctum::actingAs($user, guard: 'sanctum');

    return $user;
}

function activeResource(array $typeOverrides = [], array $resourceOverrides = []): Resource
{
    $resourceType = ResourceType::factory()->create([
        ...[
            'max_duration_minutes' => 240,
        ],
        ...$typeOverrides,
    ]);

    return Resource::factory()
        ->for($resourceType)
        ->create([
            ...[
                'status' => 'active',
            ],
            ...$resourceOverrides,
        ]);
}

function reservationPayload(Resource $resource, array $overrides = []): array
{
    return [
        ...[
            'resource_id' => $resource->id,
            'starts_at' => now()->addDay()->setTime(9, 0)->toIso8601String(),
            'ends_at' => now()->addDay()->setTime(10, 0)->toIso8601String(),
            'purpose' => 'Planning workshop',
        ],
        ...$overrides,
    ];
}

it('creates submits approves checks out and returns a reservation', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();

    $create = $this->postJson('/api/v1/reservations', reservationPayload($resource));

    $create
        ->assertCreated()
        ->assertJsonPath('data.user_id', $requester->id)
        ->assertJsonPath('data.status', 'draft');

    $reservationId = $create->json('data.id');

    $this->postJson("/api/v1/reservations/{$reservationId}/submit", [
        'note' => 'Ready for approval',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.status_logs.0.to_status', 'pending');

    actingReservationUser('manager');

    $this->postJson("/api/v1/reservations/{$reservationId}/approve", [
        'note' => 'Approved for use',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'approved')
        ->assertJsonPath('data.approved_by', auth()->id());

    $this->postJson("/api/v1/reservations/{$reservationId}/check-out", [
        'note' => 'Asset picked up',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'checked_out');

    $this->postJson("/api/v1/reservations/{$reservationId}/return", [
        'note' => 'Asset returned',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'returned')
        ->assertJsonCount(4, 'data.status_logs');
});

it('rejects approval from users without approve permission', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();
    $reservation = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create(['status' => 'pending']);

    $this->postJson("/api/v1/reservations/{$reservation->id}/approve")
        ->assertForbidden()
        ->assertJsonPath('code', 'auth.forbidden');
});

it('rejects and cancels pending reservations', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();

    $rejectable = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create(['status' => 'pending']);

    actingReservationUser('manager');

    $this->postJson("/api/v1/reservations/{$rejectable->id}/reject", [
        'reason' => 'Resource no longer available.',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected')
        ->assertJsonPath('data.rejection_reason', 'Resource no longer available.');

    Sanctum::actingAs($requester, guard: 'sanctum');

    $cancellable = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create(['status' => 'pending']);

    $this->postJson("/api/v1/reservations/{$cancellable->id}/cancel", [
        'note' => 'Requester changed plans.',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled')
        ->assertJsonPath('data.status_logs.0.to_status', 'cancelled')
        ->assertJsonPath('data.status_logs.0.note', 'Requester changed plans.');
});

it('prevents overlapping blocking reservations on submit', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();

    Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create([
            'status' => 'pending',
            'starts_at' => now()->addDay()->setTime(9, 0),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);

    $draft = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create([
            'status' => 'draft',
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(11, 0),
        ]);

    $this->postJson("/api/v1/reservations/{$draft->id}/submit")
        ->assertStatus(409)
        ->assertJsonPath('code', 'reservation.conflict');
});

it('prevents reservations over resource blackouts on submit', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();

    ResourceBlackout::factory()
        ->for($resource)
        ->create([
            'starts_at' => now()->addDay()->setTime(9, 30),
            'ends_at' => now()->addDay()->setTime(10, 30),
        ]);

    $draft = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create([
            'status' => 'draft',
            'starts_at' => now()->addDay()->setTime(9, 0),
            'ends_at' => now()->addDay()->setTime(10, 0),
        ]);

    $this->postJson("/api/v1/reservations/{$draft->id}/submit")
        ->assertStatus(409)
        ->assertJsonPath('code', 'reservation.conflict');
});

it('scopes reservation listing to own records unless user can view all', function () {
    $owner = actingReservationUser('requester');
    $other = User::factory()->create();
    $other->assignRole('requester');
    $resource = activeResource();

    Reservation::factory()->for($resource)->for($owner)->create(['purpose' => 'Own reservation']);
    Reservation::factory()->for($resource)->for($other)->create(['purpose' => 'Other reservation']);

    $this->getJson('/api/v1/reservations')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.purpose', 'Own reservation');

    actingReservationUser('manager');

    $this->getJson('/api/v1/reservations')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('updates only draft reservations and exposes audits', function () {
    $requester = actingReservationUser('requester');
    $resource = activeResource();

    $reservation = Reservation::factory()
        ->for($resource)
        ->for($requester)
        ->create(['status' => 'draft', 'purpose' => 'Original purpose']);

    $this->putJson("/api/v1/reservations/{$reservation->id}", reservationPayload($resource, [
        'purpose' => 'Updated purpose',
    ]))
        ->assertOk()
        ->assertJsonPath('data.purpose', 'Updated purpose');

    $reservation->status->transitionTo(Pending::class, $requester->id, 'Submitted');

    $this->putJson("/api/v1/reservations/{$reservation->id}", reservationPayload($resource, [
        'purpose' => 'Should fail',
    ]))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'validation.failed');

    actingReservationUser('admin');

    $this->getJson("/api/v1/reservations/{$reservation->id}/audits")
        ->assertOk()
        ->assertJsonFragment(['event' => 'updated'])
        ->assertJsonFragment(['purpose' => 'Updated purpose']);
});
