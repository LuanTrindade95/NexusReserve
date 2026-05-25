<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResourceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'resource_type_id' => $this->resource_type_id,
            'resource_type' => new ResourceTypeResource($this->whenLoaded('resourceType')),
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'location' => $this->location,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'metadata' => $this->metadata,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
