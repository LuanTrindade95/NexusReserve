<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\Pending;

class SubmitReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return Pending::class;
    }
}
