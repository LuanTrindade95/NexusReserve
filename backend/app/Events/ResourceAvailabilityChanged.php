<?php

namespace App\Events;

use App\Models\Reservation;
use App\Models\ReservationStatusLog;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResourceAvailabilityChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly ReservationStatusLog $statusLog,
    ) {}

    /**
     * @return array<int, PrivateChannel|PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("resources.{$this->reservation->resource_id}"),
            new PresenceChannel('managers.reservations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'resource.availability.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'resource_id' => $this->reservation->resource_id,
            'reservation_id' => $this->reservation->id,
            'status' => $this->reservation->status->getValue(),
            'changed_at' => $this->statusLog->created_at?->toIso8601String(),
        ];
    }
}
