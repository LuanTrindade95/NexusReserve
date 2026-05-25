<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\Returned;

class ReturnReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return Returned::class;
    }
}
