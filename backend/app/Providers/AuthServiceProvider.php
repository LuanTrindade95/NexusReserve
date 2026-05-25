<?php

namespace App\Providers;

use App\Models\Reservation;
use App\Models\Resource;
use App\Policies\ReservationPolicy;
use App\Policies\ResourcePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Resource::class => ResourcePolicy::class,
        Reservation::class => ReservationPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
