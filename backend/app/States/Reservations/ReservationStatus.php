<?php

namespace App\States\Reservations;

use App\States\Reservations\Transitions\ApproveReservation;
use App\States\Reservations\Transitions\CancelReservation;
use App\States\Reservations\Transitions\CheckOutReservation;
use App\States\Reservations\Transitions\RejectReservation;
use App\States\Reservations\Transitions\ReturnReservation;
use App\States\Reservations\Transitions\SubmitReservation;
use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class ReservationStatus extends State
{
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Pending::class, SubmitReservation::class)
            ->allowTransition(Pending::class, Approved::class, ApproveReservation::class)
            ->allowTransition(Pending::class, Rejected::class, RejectReservation::class)
            ->allowTransition(Pending::class, Cancelled::class, CancelReservation::class)
            ->allowTransition(Approved::class, CheckedOut::class, CheckOutReservation::class)
            ->allowTransition(Approved::class, Cancelled::class, CancelReservation::class)
            ->allowTransition(CheckedOut::class, Returned::class, ReturnReservation::class);
    }
}
