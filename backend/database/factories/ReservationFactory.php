<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('-7 days', '+21 days');
        $endsAt = (clone $startsAt)->modify('+'.fake()->randomElement([60, 90, 120, 180, 240]).' minutes');

        return [
            'resource_id' => Resource::factory(),
            'user_id' => User::factory(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => 'draft',
            'purpose' => fake()->randomElement([
                'Quarterly planning session',
                'Client onboarding meeting',
                'Equipment for field operation',
                'Engineering workshop',
                'Leadership review',
            ]),
        ];
    }
}
