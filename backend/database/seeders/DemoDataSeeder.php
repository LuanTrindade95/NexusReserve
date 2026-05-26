<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceBlackout;
use App\Models\ResourceType;
use App\Models\User;
use App\States\Reservations\Approved;
use App\States\Reservations\Cancelled;
use App\States\Reservations\CheckedOut;
use App\States\Reservations\Pending;
use App\States\Reservations\Rejected;
use App\States\Reservations\Returned;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $departments = collect([
            'Operations',
            'Engineering',
            'Finance',
            'People',
        ])->map(fn (string $name) => Department::create(['name' => $name]));

        $users = collect([
            'super-admin' => ['Nexus Super Admin', 'superadmin@demo', 'Operations'],
            'admin' => ['Facilities Admin', 'admin@demo', 'Operations'],
            'manager' => ['Department Manager', 'manager@demo', 'Engineering'],
            'requester' => ['Business Requester', 'requester@demo', 'Finance'],
        ])->mapWithKeys(function (array $profile, string $role) use ($departments) {
            [$name, $email, $departmentName] = $profile;

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'department_id' => $departments->firstWhere('name', $departmentName)->id,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $user->assignRole($role);

            return [$role => $user];
        });

        $requesters = collect(range(1, 8))->map(function (int $index) use ($departments) {
            $user = User::create([
                'name' => 'Requester '.$index,
                'email' => 'requester'.$index.'@demo',
                'department_id' => $departments[($index - 1) % $departments->count()]->id,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $user->assignRole('requester');

            return $user;
        });

        $resourceTypes = collect([
            ['Executive Rooms', 'executive-rooms', 'building-2', true, 240, '#06B6D4'],
            ['Vehicles', 'vehicles', 'car', true, 1440, '#3B82F6'],
            ['Notebooks', 'notebooks', 'laptop', false, 2880, '#10B981'],
            ['Projection Kits', 'projection-kits', 'projector', false, 480, '#F59E0B'],
            ['Audio Kits', 'audio-kits', 'headphones', true, 480, '#EF4444'],
        ])->map(fn (array $type) => ResourceType::create([
            'name' => $type[0],
            'slug' => $type[1],
            'icon' => $type[2],
            'requires_approval' => $type[3],
            'max_duration_minutes' => $type[4],
            'color' => $type[5],
        ]));

        $resources = collect();

        foreach ($resourceTypes as $type) {
            for ($index = 1; $index <= 5; $index++) {
                $resources->push(Resource::create([
                    'resource_type_id' => $type->id,
                    'name' => "{$type->name} {$index}",
                    'code' => strtoupper(substr($type->slug, 0, 3)).'-'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                    'description' => "Shared {$type->name} resource for internal reservations.",
                    'location' => ['HQ Floor 2', 'HQ Floor 4', 'Annex', 'Garage', 'IT Stockroom'][$index - 1],
                    'capacity' => $type->slug === 'executive-rooms' ? 4 + ($index * 2) : null,
                    'status' => $index === 5 ? 'maintenance' : 'active',
                    'metadata' => [
                        'cost_center' => 'NR-'.$type->id,
                        'requires_checklist' => in_array($type->slug, ['vehicles', 'audio-kits'], true),
                    ],
                ]));
            }
        }

        $statusPlan = [
            ...array_fill(0, 6, 'draft'),
            ...array_fill(0, 8, 'pending'),
            ...array_fill(0, 9, 'approved'),
            ...array_fill(0, 5, 'rejected'),
            ...array_fill(0, 4, 'checked_out'),
            ...array_fill(0, 5, 'returned'),
            ...array_fill(0, 3, 'cancelled'),
        ];

        foreach ($statusPlan as $index => $targetStatus) {
            $startsAt = Carbon::now()->addDays(($index % 14) - 3)->setTime(8 + ($index % 8), 0);

            $reservation = Reservation::create([
                'resource_id' => $resources[$index % $resources->count()]->id,
                'user_id' => $requesters[$index % $requesters->count()]->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addMinutes([60, 90, 120, 180][$index % 4]),
                'status' => 'draft',
                'purpose' => [
                    'Planning workshop',
                    'Client session',
                    'Field visit',
                    'Device replacement',
                    'Training event',
                ][$index % 5],
            ]);

            $this->moveReservationTo($reservation, $targetStatus, $users['manager']->id);
        }

        foreach ($resources->where('status', 'active')->take(6)->values() as $index => $resource) {
            $startsAt = Carbon::now()->addDays($index + 1)->setTime(18, 0);

            ResourceBlackout::create([
                'resource_id' => $resource->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addHours(3),
                'reason' => [
                    'Preventive maintenance',
                    'Inventory audit',
                    'Cleaning window',
                    'Safety inspection',
                    'Software update',
                    'Battery replacement',
                ][$index],
            ]);
        }
    }

    private function moveReservationTo(Reservation $reservation, string $targetStatus, int $managerId): void
    {
        match ($targetStatus) {
            'draft' => null,
            'pending' => $reservation->status->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval'),
            'approved' => $reservation->status
                ->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval')
                ->status
                ->transitionTo(Approved::class, $managerId, 'Approved for planned use'),
            'rejected' => $reservation->status
                ->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval')
                ->status
                ->transitionTo(Rejected::class, $managerId, 'Resource unavailable for the requested window'),
            'checked_out' => $reservation->status
                ->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval')
                ->status
                ->transitionTo(Approved::class, $managerId, 'Approved for planned use')
                ->status
                ->transitionTo(CheckedOut::class, $managerId, 'Resource checked out'),
            'returned' => $reservation->status
                ->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval')
                ->status
                ->transitionTo(Approved::class, $managerId, 'Approved for planned use')
                ->status
                ->transitionTo(CheckedOut::class, $managerId, 'Resource checked out')
                ->status
                ->transitionTo(Returned::class, $managerId, 'Resource returned in good condition'),
            'cancelled' => $reservation->status
                ->transitionTo(Pending::class, $reservation->user_id, 'Submitted for approval')
                ->status
                ->transitionTo(Cancelled::class, $reservation->user_id, 'Requester cancelled before approval'),
        };
    }
}
