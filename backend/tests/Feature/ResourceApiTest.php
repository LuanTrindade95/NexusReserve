<?php

use App\Models\Resource;
use App\Models\ResourceBlackout;
use App\Models\ResourceType;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    config(['audit.console' => true]);
});

function actingAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');
    Sanctum::actingAs($user, guard: 'sanctum');

    return $user;
}

function actingRequester(): User
{
    $user = User::factory()->create();
    $user->assignRole('requester');
    Sanctum::actingAs($user, guard: 'sanctum');

    return $user;
}

function validResourcePayload(ResourceType $resourceType, array $overrides = []): array
{
    return [
        ...[
            'resource_type_id' => $resourceType->id,
            'name' => 'Executive Room Alpha',
            'code' => 'ROOM-ALPHA',
            'description' => 'Board room with conferencing setup.',
            'location' => 'HQ Floor 10',
            'capacity' => 12,
            'status' => 'active',
            'metadata' => [
                'owner_team' => 'Facilities',
            ],
        ],
        ...$overrides,
    ];
}

it('creates updates soft deletes and restores a resource', function () {
    actingAdmin();

    $resourceType = ResourceType::factory()->create();

    $create = $this->postJson('/api/v1/resources', validResourcePayload($resourceType));

    $create
        ->assertCreated()
        ->assertJsonPath('data.code', 'ROOM-ALPHA')
        ->assertJsonPath('data.resource_type.id', $resourceType->id);

    $resourceId = $create->json('data.id');

    $update = $this->putJson("/api/v1/resources/{$resourceId}", validResourcePayload($resourceType, [
        'name' => 'Executive Room Alpha Renovated',
        'status' => 'maintenance',
    ]));

    $update
        ->assertOk()
        ->assertJsonPath('data.name', 'Executive Room Alpha Renovated')
        ->assertJsonPath('data.status', 'maintenance');

    $this->deleteJson("/api/v1/resources/{$resourceId}")
        ->assertNoContent();

    expect(Resource::withTrashed()->find($resourceId)->trashed())->toBeTrue();

    $this->postJson("/api/v1/resources/{$resourceId}/restore")
        ->assertOk()
        ->assertJsonPath('data.id', $resourceId)
        ->assertJsonPath('data.deleted_at', null);

    expect(Resource::find($resourceId))->not->toBeNull();
});

it('rejects duplicate resource codes', function () {
    actingAdmin();

    $resourceType = ResourceType::factory()->create();
    Resource::factory()->for($resourceType)->create(['code' => 'ROOM-ALPHA']);

    $this->postJson('/api/v1/resources', validResourcePayload($resourceType))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'validation.failed')
        ->assertJsonValidationErrors('code');
});

it('filters resources by status', function () {
    actingRequester();

    $resourceType = ResourceType::factory()->create();
    Resource::factory()->for($resourceType)->create(['name' => 'Active Room', 'status' => 'active']);
    Resource::factory()->for($resourceType)->create(['name' => 'Maintenance Room', 'status' => 'maintenance']);

    $response = $this->getJson('/api/v1/resources?status=active&sort=name');

    $response
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Active Room')
        ->assertJsonPath('data.0.status', 'active');
});

it('forbids users without resources manage from creating resources', function () {
    actingRequester();

    $resourceType = ResourceType::factory()->create();

    $this->postJson('/api/v1/resources', validResourcePayload($resourceType))
        ->assertForbidden()
        ->assertJsonPath('code', 'auth.forbidden');
});

it('returns resource audits after an update', function () {
    actingAdmin();

    $resourceType = ResourceType::factory()->create();
    $resource = Resource::factory()->for($resourceType)->create(['name' => 'Audit Room']);

    $this->putJson("/api/v1/resources/{$resource->id}", validResourcePayload($resourceType, [
        'name' => 'Audit Room Updated',
        'code' => $resource->code,
    ]))->assertOk();

    $response = $this->getJson("/api/v1/resources/{$resource->id}/audits");

    $response
        ->assertOk()
        ->assertJsonFragment(['event' => 'updated'])
        ->assertJsonFragment(['name' => 'Audit Room Updated']);
});

it('manages resource types', function () {
    actingAdmin();

    $create = $this->postJson('/api/v1/resource-types', [
        'name' => 'Training Rooms',
        'slug' => 'training-rooms',
        'icon' => 'presentation',
        'requires_approval' => true,
        'max_duration_minutes' => 240,
        'color' => '#06B6D4',
    ]);

    $create
        ->assertCreated()
        ->assertJsonPath('data.slug', 'training-rooms');

    $id = $create->json('data.id');

    $this->putJson("/api/v1/resource-types/{$id}", [
        'name' => 'Training Rooms Updated',
        'slug' => 'training-rooms',
        'icon' => 'presentation',
        'requires_approval' => false,
        'max_duration_minutes' => 480,
        'color' => '#3B82F6',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Training Rooms Updated')
        ->assertJsonPath('data.requires_approval', false);
});

it('creates lists and deletes resource blackouts', function () {
    actingAdmin();

    $resource = Resource::factory()->create();

    $create = $this->postJson("/api/v1/resources/{$resource->id}/blackouts", [
        'starts_at' => now()->addDay()->toIso8601String(),
        'ends_at' => now()->addDay()->addHours(2)->toIso8601String(),
        'reason' => 'Preventive maintenance',
    ]);

    $create
        ->assertCreated()
        ->assertJsonPath('data.reason', 'Preventive maintenance');

    $blackoutId = $create->json('data.id');

    $this->getJson("/api/v1/resources/{$resource->id}/blackouts")
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->deleteJson("/api/v1/resources/{$resource->id}/blackouts/{$blackoutId}")
        ->assertNoContent();

    expect(ResourceBlackout::find($blackoutId))->toBeNull();
});
