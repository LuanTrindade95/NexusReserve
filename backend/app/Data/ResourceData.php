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
}
