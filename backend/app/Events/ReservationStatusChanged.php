<?php

namespace App\Events;

use App\Models\Reservation;
use App\Models\ReservationStatusLog;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationStatusChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly ReservationStatusLog $statusLog,
    ) {}

    /**
     * @return array<int, PrivateChannel|PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("resources.{$this->reservation->resource_id}"),
            new PrivateChannel("users.{$this->reservation->user_id}"),
            new PresenceChannel('managers.reservations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reservation.status.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $reservation = $this->reservation->loadMissing(['resource.resourceType', 'user', 'approver', 'statusLogs']);

        return [
            'reservation' => [
                'id' => $reservation->id,
                'resource_id' => $reservation->resource_id,
                'user_id' => $reservation->user_id,
                'starts_at' => $reservation->starts_at?->toIso8601String(),
                'ends_at' => $reservation->ends_at?->toIso8601String(),
                'status' => $reservation->status->getValue(),
                'purpose' => $reservation->purpose,
                'approved_by' => $reservation->approved_by,
                'approved_at' => $reservation->approved_at?->toIso8601String(),
                'rejection_reason' => $reservation->rejection_reason,
                'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
                'resource' => $reservation->resource ? [
                    'id' => $reservation->resource->id,
                    'name' => $reservation->resource->name,
                    'code' => $reservation->resource->code,
                    'location' => $reservation->resource->location,
                    'status' => $reservation->resource->status,
                ] : null,
                'user' => $reservation->user ? [
                    'id' => $reservation->user->id,
                    'name' => $reservation->user->name,
                    'email' => $reservation->user->email,
                    'department_id' => $reservation->user->department_id,
                    'roles' => $reservation->user->getRoleNames()->values(),
                    'permissions' => $reservation->user->getAllPermissions()->pluck('name')->sort()->values(),
                ] : null,
                'approver' => $reservation->approver ? [
                    'id' => $reservation->approver->id,
                    'name' => $reservation->approver->name,
                    'email' => $reservation->approver->email,
                    'department_id' => $reservation->approver->department_id,
                    'roles' => $reservation->approver->getRoleNames()->values(),
                    'permissions' => $reservation->approver->getAllPermissions()->pluck('name')->sort()->values(),
                ] : null,
                'status_logs' => $reservation->statusLogs->map(fn (ReservationStatusLog $log) => [
                    'id' => $log->id,
                    'reservation_id' => $log->reservation_id,
                    'from_status' => $log->from_status,
                    'to_status' => $log->to_status,
                    'changed_by' => $log->changed_by,
                    'note' => $log->note,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])->values(),
                'deleted_at' => $reservation->deleted_at?->toIso8601String(),
                'created_at' => $reservation->created_at?->toIso8601String(),
                'updated_at' => $reservation->updated_at?->toIso8601String(),
            ],
            'status_log' => [
                'id' => $this->statusLog->id,
                'reservation_id' => $this->statusLog->reservation_id,
                'from_status' => $this->statusLog->from_status,
                'to_status' => $this->statusLog->to_status,
                'changed_by' => $this->statusLog->changed_by,
                'note' => $this->statusLog->note,
                'created_at' => $this->statusLog->created_at?->toIso8601String(),
            ],
        ];
    }
}
