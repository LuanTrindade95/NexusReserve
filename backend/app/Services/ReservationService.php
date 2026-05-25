<?php

namespace App\Services;

use App\Data\ReservationData;
use App\Events\ReservationStatusChanged;
use App\Exceptions\ReservationConflictException;
use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceBlackout;
use App\Models\User;
use App\States\Reservations\Approved;
use App\States\Reservations\Cancelled;
use App\States\Reservations\CheckedOut;
use App\States\Reservations\Pending;
use App\States\Reservations\Rejected;
use App\States\Reservations\Returned;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    private const BLOCKING_STATUSES = ['pending', 'approved', 'checked_out'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Reservation>
     */
    public function paginate(array $filters, User $user): LengthAwarePaginator
    {
        $query = Reservation::query()
            ->with(['resource.resourceType', 'user', 'approver'])
            ->withCount('statusLogs');

        if (($filters['mine'] ?? false) || ! $user->can('reservations.view-all')) {
            $query->where('user_id', $user->id);
        } elseif (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['starts_from'])) {
            $query->where('starts_at', '>=', $filters['starts_from']);
        }

        if (isset($filters['ends_until'])) {
            $query->where('ends_at', '<=', $filters['ends_until']);
        }

        if (isset($filters['search'])) {
            $query->where('purpose', 'like', "%{$filters['search']}%");
        }

        $sort = $filters['sort'] ?? 'starts_at';
        $direction = $filters['direction'] ?? 'asc';
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(ReservationData $data): Reservation
    {
        return DB::transaction(function () use ($data) {
            $resource = $this->lockResource($data->resourceId);
            $startsAt = Carbon::parse($data->startsAt);
            $endsAt = Carbon::parse($data->endsAt);

            $this->assertResourceCanBlockAvailability($resource);
            $this->assertMaxDuration($resource, $startsAt, $endsAt);
            $this->assertNoConflict($resource, $startsAt, $endsAt);

            $reservation = Reservation::create([
                ...$data->toModelAttributes(),
                'status' => 'draft',
            ]);

            if ($resource->resourceType?->requires_approval === false) {
                return $this->autoApprove($reservation, $data->userId);
            }

            $reservation->status->transitionTo(Pending::class, $data->userId, 'Submitted for approval');

            return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
        });
    }

    public function update(Reservation $reservation, ReservationData $data): Reservation
    {
        if (! in_array($reservation->status->getValue(), ['draft', 'pending'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only draft or pending reservations can be edited.'],
            ]);
        }

        return DB::transaction(function () use ($reservation, $data) {
            $resource = $this->lockResource($data->resourceId);
            $startsAt = Carbon::parse($data->startsAt);
            $endsAt = Carbon::parse($data->endsAt);

            $this->assertResourceCanBlockAvailability($resource);
            $this->assertMaxDuration($resource, $startsAt, $endsAt);
            $this->assertNoConflict($resource, $startsAt, $endsAt, $reservation->id);

            $reservation->update($data->toModelAttributes());

            return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
        });
    }

    public function delete(Reservation $reservation): void
    {
        if (! in_array($reservation->status->getValue(), ['draft', 'cancelled', 'rejected'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only draft, cancelled or rejected reservations can be deleted.'],
            ]);
        }

        $reservation->delete();
    }

    public function submit(Reservation $reservation, int $actorId, ?string $note = null): Reservation
    {
        return $this->transitionWithAvailabilityCheck(
            $reservation,
            Pending::class,
            $actorId,
            $note ?? 'Submitted for approval',
        );
    }

    public function approve(Reservation $reservation, int $actorId, ?string $note = null): Reservation
    {
        return $this->transitionWithAvailabilityCheck(
            $reservation,
            Approved::class,
            $actorId,
            $note ?? 'Approved',
        );
    }

    public function reject(Reservation $reservation, int $actorId, string $reason): Reservation
    {
        $reservation->status->transitionTo(Rejected::class, $actorId, $reason);

        return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
    }

    public function checkOut(Reservation $reservation, int $actorId, ?string $note = null): Reservation
    {
        $reservation->status->transitionTo(CheckedOut::class, $actorId, $note ?? 'Checked out');

        return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
    }

    public function returnReservation(Reservation $reservation, int $actorId, ?string $note = null): Reservation
    {
        $reservation->status->transitionTo(Returned::class, $actorId, $note ?? 'Returned');

        return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
    }

    public function cancel(Reservation $reservation, int $actorId, ?string $note = null): Reservation
    {
        $reservation->status->transitionTo(Cancelled::class, $actorId, $note ?? 'Cancelled');

        return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
    }

    /**
     * @param  class-string  $targetState
     */
    private function transitionWithAvailabilityCheck(
        Reservation $reservation,
        string $targetState,
        int $actorId,
        string $note,
    ): Reservation {
        return DB::transaction(function () use ($reservation, $targetState, $actorId, $note) {
            $lockedResource = $this->lockResource($reservation->resource_id);
            $this->assertResourceCanBlockAvailability($lockedResource);
            $this->assertMaxDuration($lockedResource, $reservation->starts_at, $reservation->ends_at);
            $this->assertNoConflict(
                $lockedResource,
                $reservation->starts_at,
                $reservation->ends_at,
                $reservation->id,
            );

            $reservation->status->transitionTo($targetState, $actorId, $note);

            return $reservation->refresh()->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
        });
    }

    private function autoApprove(Reservation $reservation, int $actorId): Reservation
    {
        $reservation->forceFill([
            'status' => 'approved',
            'approved_by' => $actorId,
            'approved_at' => now(),
            'rejection_reason' => null,
            'cancelled_at' => null,
        ])->save();

        $statusLog = $reservation->statusLogs()->create([
            'from_status' => 'draft',
            'to_status' => 'approved',
            'changed_by' => $actorId,
            'note' => 'Auto-approved because the resource type does not require approval.',
        ]);

        $reservation->refresh();

        ReservationStatusChanged::dispatch($reservation, $statusLog);

        return $reservation->load(['resource.resourceType', 'user', 'approver', 'statusLogs']);
    }

    private function lockResource(int $resourceId): Resource
    {
        return Resource::query()
            ->with('resourceType')
            ->whereKey($resourceId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function assertResourceCanBlockAvailability(Resource $resource): void
    {
        if ($resource->status !== 'active') {
            throw ValidationException::withMessages([
                'resource_id' => ['Only active resources can be reserved.'],
            ]);
        }
    }

    private function assertMaxDuration(Resource $resource, Carbon|string $startsAt, Carbon|string $endsAt): void
    {
        $startsAt = $startsAt instanceof Carbon ? $startsAt : Carbon::parse($startsAt);
        $endsAt = $endsAt instanceof Carbon ? $endsAt : Carbon::parse($endsAt);
        $maxDuration = $resource->resourceType?->max_duration_minutes;

        if ($maxDuration !== null && $startsAt->diffInMinutes($endsAt) > $maxDuration) {
            throw ValidationException::withMessages([
                'ends_at' => ["Reservation duration cannot exceed {$maxDuration} minutes for this resource type."],
            ]);
        }
    }

    private function assertNoConflict(
        Resource $resource,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $ignoreReservationId = null,
    ): void {
        $reservationConflict = Reservation::query()
            ->where('resource_id', $resource->id)
            ->whereIn('status', self::BLOCKING_STATUSES)
            ->when($ignoreReservationId !== null, fn ($query) => $query->whereKeyNot($ignoreReservationId))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($reservationConflict) {
            throw new ReservationConflictException(
                'The resource already has a blocking reservation in this time window.',
                ['starts_at' => ['Reservation overlaps another pending, approved or checked-out reservation.']],
            );
        }

        $blackoutConflict = ResourceBlackout::query()
            ->where('resource_id', $resource->id)
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($blackoutConflict) {
            throw new ReservationConflictException(
                'The resource has a blackout in this time window.',
                ['starts_at' => ['Reservation overlaps a resource blackout.']],
            );
        }
    }
}
