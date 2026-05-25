<?php

namespace App\Data;

use App\Models\ResourceBlackout;
use Spatie\LaravelData\Data;

class ResourceBlackoutData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $resourceId,
        public readonly string $startsAt,
        public readonly string $endsAt,
        public readonly string $reason,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated, int $resourceId, ?ResourceBlackout $blackout = null): self
    {
        return new self(
            id: $blackout?->id,
            resourceId: $resourceId,
            startsAt: $validated['starts_at'],
            endsAt: $validated['ends_at'],
            reason: $validated['reason'],
        );
    }

    public static function fromModel(ResourceBlackout $blackout): self
    {
        return new self(
            id: $blackout->id,
            resourceId: $blackout->resource_id,
            startsAt: $blackout->starts_at->toIso8601String(),
            endsAt: $blackout->ends_at->toIso8601String(),
            reason: $blackout->reason,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toModelAttributes(): array
    {
        return [
            'resource_id' => $this->resourceId,
            'starts_at' => $this->startsAt,
            'ends_at' => $this->endsAt,
            'reason' => $this->reason,
        ];
    }
}
