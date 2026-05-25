<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\Cancelled;

class CancelReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return Cancelled::class;
    }

    protected function applyStateMetadata(): void
    {
        $this->reservation->cancelled_at = now();
    }
}
