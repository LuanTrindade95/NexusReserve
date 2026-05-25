<?php

namespace App\Listeners;

use App\Events\ReservationStatusChanged;
use App\Events\ResourceAvailabilityChanged;
use App\Models\User;
use App\Notifications\ReservationDecisionNotification;
use App\Notifications\ReservationPendingApprovalNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Spatie\Permission\Models\Permission;

class QueueReservationStatusNotification implements ShouldQueue
{
    public function handle(ReservationStatusChanged $event): void
    {
        $reservation = $event->reservation->loadMissing(['resource', 'user']);
        $toStatus = $event->statusLog->to_status;

        if ($toStatus === 'pending' && Permission::query()->where('name', 'reservations.approve')->exists()) {
            User::permission('reservations.approve')
                ->get()
                ->each(fn (User $manager) => $manager->notify(
                    new ReservationPendingApprovalNotification($reservation)
                ));
        }

        if (in_array($toStatus, ['approved', 'rejected'], true) && $reservation->user !== null) {
            $reservation->user->notify(
                new ReservationDecisionNotification($reservation, $event->statusLog)
            );
        }

        ResourceAvailabilityChanged::dispatch($reservation, $event->statusLog);
    }
}
