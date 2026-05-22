<?php

use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceType;
use App\Models\User;
use App\States\Reservations\Approved;
use App\States\Reservations\Pending;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\ModelStates\Exceptions\CouldNotPerformTransition;

uses(RefreshDatabase::class);

it('transitions a draft reservation to pending and writes a status log', function () {
    $user = User::factory()->create();
    $resourceType = ResourceType::factory()->create();
    $resource = Resource::factory()->for($resourceType)->create();
    $reservation = Reservation::factory()
        ->for($resource)
        ->for($user)
        ->create(['status' => 'draft']);

    $reservation->status->transitionTo(Pending::class, $user->id, 'Ready for approval');

    $reservation->refresh();

    expect($reservation->status->getValue())->toBe('pending')
        ->and($reservation->statusLogs)->toHaveCount(1)
        ->and($reservation->statusLogs->first()->from_status)->toBe('draft')
        ->and($reservation->statusLogs->first()->to_status)->toBe('pending')
        ->and($reservation->statusLogs->first()->changed_by)->toBe($user->id)
        ->and($reservation->statusLogs->first()->note)->toBe('Ready for approval');
});

it('rejects an invalid draft to approved transition', function () {
    $user = User::factory()->create();
    $resourceType = ResourceType::factory()->create();
    $resource = Resource::factory()->for($resourceType)->create();
    $reservation = Reservation::factory()
        ->for($resource)
        ->for($user)
        ->create(['status' => 'draft']);

    $reservation->status->transitionTo(Approved::class, $user->id, 'Skipping approval');
})->throws(CouldNotPerformTransition::class);
