<?php

namespace App\Data;

use App\Models\ResourceType;
use Spatie\LaravelData\Data;

class ResourceTypeData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $icon,
        public readonly bool $requiresApproval,
        public readonly ?int $maxDurationMinutes,
        public readonly ?string $color,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated, ?ResourceType $resourceType = null): self
    {
        return new self(
            id: $resourceType?->id,
            name: $validated['name'],
            slug: $validated['slug'],
            icon: $validated['icon'] ?? null,
            requiresApproval: (bool) $validated['requires_approval'],
            maxDurationMinutes: $validated['max_duration_minutes'] ?? null,
            color: $validated['color'] ?? null,
        );
    }

    public static function fromModel(ResourceType $resourceType): self
    {
        return new self(
            id: $resourceType->id,
            name: $resourceType->name,
            slug: $resourceType->slug,
            icon: $resourceType->icon,
            requiresApproval: $resourceType->requires_approval,
            maxDurationMinutes: $resourceType->max_duration_minutes,
            color: $resourceType->color,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toModelAttributes(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'requires_approval' => $this->requiresApproval,
            'max_duration_minutes' => $this->maxDurationMinutes,
            'color' => $this->color,
        ];
    }
}
