<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ReservationPendingApprovalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @var array<string, mixed>
     */
    private readonly array $payload;

    public function __construct(Reservation $reservation)
    {
        $reservation->loadMissing(['resource']);

        $this->payload = [
            'title' => 'Reservation pending approval',
            'message' => "{$reservation->purpose} is waiting for manager review.",
            'reservation_id' => $reservation->id,
            'resource_id' => $reservation->resource_id,
            'resource_name' => $reservation->resource?->name,
            'status' => $reservation->status->getValue(),
        ];
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload);
    }
}
