<?php

namespace App\Data;

use App\Models\Reservation;
use Spatie\LaravelData\Data;

class ReservationData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $resourceId,
        public readonly int $userId,
        public readonly string $startsAt,
        public readonly string $endsAt,
        public readonly string $status,
        public readonly string $purpose,
        public readonly ?int $approvedBy,
        public readonly ?string $approvedAt,
        public readonly ?string $rejectionReason,
        public readonly ?string $cancelledAt,
    ) {}

    public static function fromModel(Reservation $reservation): self
    {
        return new self(
            id: $reservation->id,
            resourceId: $reservation->resource_id,
            userId: $reservation->user_id,
            startsAt: $reservation->starts_at->toIso8601String(),
            endsAt: $reservation->ends_at->toIso8601String(),
            status: $reservation->status->getValue(),
            purpose: $reservation->purpose,
            approvedBy: $reservation->approved_by,
            approvedAt: $reservation->approved_at?->toIso8601String(),
            rejectionReason: $reservation->rejection_reason,
            cancelledAt: $reservation->cancelled_at?->toIso8601String(),
        );
    }
}
