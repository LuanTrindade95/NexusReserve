<?php

namespace App\Listeners;

use App\Events\ReservationStatusChanged;
use Illuminate\Contracts\Queue\ShouldQueue;

class QueueReservationStatusNotification implements ShouldQueue
{
    public function handle(ReservationStatusChanged $event): void
    {
        // Notification dispatching is wired here in a later phase.
    }
}
