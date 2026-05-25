<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\Rejected;

class RejectReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return Rejected::class;
    }

    protected function applyStateMetadata(): void
    {
        $this->reservation->rejection_reason = $this->note;
    }
}
