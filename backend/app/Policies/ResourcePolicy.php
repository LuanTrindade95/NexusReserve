<?php

namespace App\Policies;

use App\Models\Resource;
use App\Models\User;

class ResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('resources.manage')
            || $user->can('reservations.create')
            || $user->can('reservations.view-all');
    }

    public function view(User $user, Resource $resource): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can('resources.manage');
    }

    public function update(User $user, Resource $resource): bool
    {
        return $user->can('resources.manage');
    }

    public function delete(User $user, Resource $resource): bool
    {
        return $user->can('resources.manage');
    }

    public function restore(User $user, Resource $resource): bool
    {
        return $user->can('resources.manage');
    }

    public function forceDelete(User $user, Resource $resource): bool
    {
        return $user->can('resources.manage');
    }
}
