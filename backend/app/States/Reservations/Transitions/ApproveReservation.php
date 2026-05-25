<?php

namespace App\States\Reservations\Transitions;

use App\States\Reservations\Approved;

class ApproveReservation extends ReservationTransition
{
    protected function targetState(): string
    {
        return Approved::class;
    }

    protected function applyStateMetadata(): void
    {
        $this->reservation->approved_by = $this->changedBy;
        $this->reservation->approved_at = now();
        $this->reservation->rejection_reason = null;
        $this->reservation->cancelled_at = null;
    }
}
