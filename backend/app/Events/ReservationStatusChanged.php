<?php

namespace App\Events;

use App\Models\Reservation;
use App\Models\ReservationStatusLog;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationStatusChanged
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly ReservationStatusLog $statusLog,
    ) {}
}
