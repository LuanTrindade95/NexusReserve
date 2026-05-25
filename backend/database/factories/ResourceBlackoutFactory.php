<?php

namespace Database\Factories;

use App\Models\Resource;
use App\Models\ResourceBlackout;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResourceBlackout>
 */
class ResourceBlackoutFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('now', '+30 days');
        $endsAt = (clone $startsAt)->modify('+'.fake()->randomElement([120, 240, 480]).' minutes');

        return [
            'resource_id' => Resource::factory(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'reason' => fake()->randomElement([
                'Preventive maintenance',
                'Firmware update',
                'Cleaning window',
                'Safety inspection',
            ]),
        ];
    }
}
