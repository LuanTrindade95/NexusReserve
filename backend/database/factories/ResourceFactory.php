<?php

namespace Database\Factories;

use App\Models\Resource;
use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<resource>
 */
class ResourceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'resource_type_id' => ResourceType::factory(),
            'name' => fake()->words(3, true),
            'code' => fake()->unique()->bothify('RS-###-??'),
            'description' => fake()->sentence(),
            'location' => fake()->randomElement(['HQ 3rd floor', 'HQ 5th floor', 'Warehouse', 'Remote pool']),
            'capacity' => fake()->optional()->numberBetween(1, 20),
            'status' => fake()->randomElement(['active', 'active', 'active', 'maintenance', 'retired']),
            'metadata' => [
                'asset_tag' => fake()->bothify('AT-####'),
                'owner_team' => fake()->randomElement(['Facilities', 'IT', 'Operations']),
            ],
        ];
    }
}
