<?php

namespace App\Http\Controllers\Api\V1\Notifications;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class NotificationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return NotificationResource::collection(
            request()->user()
                ->notifications()
                ->latest()
                ->paginate((int) request('per_page', 15))
        );
    }

    public function markAsRead(string $notification): NotificationResource
    {
        $notification = request()->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $notification->markAsRead();

        return new NotificationResource($notification->refresh());
    }

    public function markAllAsRead(): Response
    {
        request()->user()->unreadNotifications->markAsRead();

        return response()->noContent();
    }
}
