<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('users.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('resources.{resourceId}', function ($user, int $resourceId) {
    return $user->hasPermissionTo('reservations.view-all', 'web')
        || $user->hasPermissionTo('resources.manage', 'web');
});

Broadcast::channel('managers.reservations', function ($user) {
    if (! $user->hasPermissionTo('reservations.approve', 'web')) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ];
});
