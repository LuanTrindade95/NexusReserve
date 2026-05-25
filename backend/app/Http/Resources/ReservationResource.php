<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'resource_id' => $this->resource_id,
            'resource' => new ResourceResource($this->whenLoaded('resource')),
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'status' => $this->status->getValue(),
            'purpose' => $this->purpose,
            'approved_by' => $this->approved_by,
            'approver' => new UserResource($this->whenLoaded('approver')),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'status_logs' => ReservationStatusLogResource::collection($this->whenLoaded('statusLogs')),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
