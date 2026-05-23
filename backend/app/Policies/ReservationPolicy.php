<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('reservations.view-all')
            || $user->can('reservations.create');
    }

    public function view(User $user, Reservation $reservation): bool
    {
        return $user->can('reservations.view-all')
            || $reservation->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('reservations.create');
    }

    public function update(User $user, Reservation $reservation): bool
    {
        return $user->can('reservations.create') && $reservation->user_id === $user->id;
    }

    public function delete(User $user, Reservation $reservation): bool
    {
        return $this->update($user, $reservation);
    }

    public function approve(User $user, Reservation $reservation): bool
    {
        return $user->can('reservations.approve');
    }

    public function viewAudit(User $user, Reservation $reservation): bool
    {
        return $user->can('audit.view');
    }
}
