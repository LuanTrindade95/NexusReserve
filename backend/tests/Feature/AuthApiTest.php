<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns a token when credentials are valid', function () {
    User::factory()->create([
        'email' => 'admin@example.test',
        'password' => Hash::make('password'),
    ])->assignRole('admin');

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.test',
        'password' => 'password',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'name',
                'email',
                'roles',
                'permissions',
            ],
        ]);
});

it('rejects invalid credentials', function () {
    User::factory()->create([
        'email' => 'admin@example.test',
        'password' => Hash::make('password'),
    ])->assignRole('admin');

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.test',
        'password' => 'wrong-password',
    ]);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('code', 'auth.invalid_credentials');
});

it('returns the authenticated user roles and permissions', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);

    $user->assignRole('manager');

    $login = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $token = $login->json('token');

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me');

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.roles.0', 'manager')
        ->assertJsonFragment(['reservations.approve']);
});

it('rejects protected routes without a token', function () {
    $response = $this->getJson('/api/v1/auth/me');

    $response
        ->assertUnauthorized()
        ->assertJsonPath('code', 'auth.unauthenticated');
});

it('rejects users without the required permission', function () {
    Route::middleware(['api', 'auth:sanctum', 'permission:resources.manage'])
        ->get('/api/v1/test/resources-manage', fn () => response()->json(['ok' => true]));

    $user = User::factory()->create();
    $user->assignRole('requester');

    $token = $user->createToken('test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/test/resources-manage');

    $response
        ->assertForbidden()
        ->assertJsonPath('code', 'auth.forbidden');
});
