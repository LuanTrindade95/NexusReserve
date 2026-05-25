<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\ReservationStatusLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ReservationDecisionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @var array<string, mixed>
     */
    private readonly array $payload;

    public function __construct(Reservation $reservation, ReservationStatusLog $statusLog)
    {
        $reservation->loadMissing(['resource']);
        $status = $reservation->status->getValue();
        $title = $status === 'approved' ? 'Reservation approved' : 'Reservation rejected';

        $this->payload = [
            'title' => $title,
            'message' => "{$reservation->purpose} was {$status}.",
            'reservation_id' => $reservation->id,
            'resource_id' => $reservation->resource_id,
            'resource_name' => $reservation->resource?->name,
            'status' => $status,
            'note' => $statusLog->note,
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
