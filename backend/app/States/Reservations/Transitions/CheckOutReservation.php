<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\CheckedOut;

class CheckOutReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return CheckedOut::class;
    }
}
