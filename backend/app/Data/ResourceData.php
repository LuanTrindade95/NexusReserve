<?php

namespace App\Data;

use App\Models\Resource;
use Spatie\LaravelData\Data;

class ResourceData extends Data
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function __construct(
        public readonly ?int $id,
        public readonly int $resourceTypeId,
        public readonly string $name,
        public readonly string $code,
        public readonly ?string $description,
        public readonly string $location,
        public readonly ?int $capacity,
        public readonly string $status,
        public readonly ?array $metadata,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated, ?Resource $resource = null): self
    {
        return new self(
            id: $resource?->id,
            resourceTypeId: $validated['resource_type_id'],
            name: $validated['name'],
            code: $validated['code'],
            description: $validated['description'] ?? null,
            location: $validated['location'],
            capacity: $validated['capacity'] ?? null,
            status: $validated['status'],
            metadata: $validated['metadata'] ?? null,
        );
    }

    public static function fromModel(Resource $resource): self
    {
        return new self(
            id: $resource->id,
            resourceTypeId: $resource->resource_type_id,
            name: $resource->name,
            code: $resource->code,
            description: $resource->description,
            location: $resource->location,
            capacity: $resource->capacity,
            status: $resource->status,
            metadata: $resource->metadata,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toModelAttributes(): array
    {
        return [
            'resource_type_id' => $this->resourceTypeId,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'location' => $this->location,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'metadata' => $this->metadata,
        ];
    }
}
