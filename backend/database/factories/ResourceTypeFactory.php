<?php

namespace Database\Factories;

use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ResourceType>
 */
class ResourceTypeFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Meeting Room',
            'Vehicle',
            'Notebook',
            'Projector',
            'Audio Kit',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'icon' => 'box',
            'requires_approval' => fake()->boolean(70),
            'max_duration_minutes' => fake()->randomElement([120, 240, 480, 1440]),
            'color' => fake()->hexColor(),
        ];
    }
}
