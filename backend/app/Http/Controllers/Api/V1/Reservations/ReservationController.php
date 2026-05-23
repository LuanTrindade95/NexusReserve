<?php

namespace App\Http\Controllers\Api\V1\Reservations;

use App\Data\ReservationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reservations\IndexReservationsRequest;
use App\Http\Requests\Reservations\RejectReservationRequest;
use App\Http\Requests\Reservations\StoreReservationRequest;
use App\Http\Requests\Reservations\TransitionReservationRequest;
use App\Http\Requests\Reservations\UpdateReservationRequest;
use App\Http\Resources\AuditResource;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservations) {}

    public function index(IndexReservationsRequest $request): AnonymousResourceCollection
    {
        return ReservationResource::collection(
            $this->reservations->paginate($request->validated(), $request->user())
        );
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $reservation = $this->reservations->create(
            ReservationData::fromValidated($request->validated(), $request->user()->id)
        );

        return (new ReservationResource($reservation))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        Gate::authorize('view', $reservation);

        return new ReservationResource(
            $reservation->load(['resource.resourceType', 'user', 'approver', 'statusLogs'])
        );
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): ReservationResource
    {
        $reservation = $this->reservations->update(
            $reservation,
            ReservationData::fromValidated($request->validated(), $reservation->user_id, $reservation)
        );

        return new ReservationResource($reservation);
    }

    public function destroy(Reservation $reservation): Response
    {
        Gate::authorize('delete', $reservation);

        $this->reservations->delete($reservation);

        return response()->noContent();
    }

    public function submit(TransitionReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('update', $reservation);

        return new ReservationResource(
            $this->reservations->submit($reservation, $request->user()->id, $request->validated('note'))
        );
    }

    public function approve(TransitionReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('approve', $reservation);

        return new ReservationResource(
            $this->reservations->approve($reservation, $request->user()->id, $request->validated('note'))
        );
    }

    public function reject(RejectReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('approve', $reservation);

        return new ReservationResource(
            $this->reservations->reject($reservation, $request->user()->id, $request->validated('reason'))
        );
    }

    public function checkOut(TransitionReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('approve', $reservation);

        return new ReservationResource(
            $this->reservations->checkOut($reservation, $request->user()->id, $request->validated('note'))
        );
    }

    public function returnReservation(TransitionReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('approve', $reservation);

        return new ReservationResource(
            $this->reservations->returnReservation($reservation, $request->user()->id, $request->validated('note'))
        );
    }

    public function cancel(TransitionReservationRequest $request, Reservation $reservation): ReservationResource
    {
        Gate::authorize('update', $reservation);

        return new ReservationResource(
            $this->reservations->cancel($reservation, $request->user()->id, $request->validated('note'))
        );
    }

    public function audits(Reservation $reservation): AnonymousResourceCollection
    {
        Gate::authorize('view', $reservation);
        Gate::authorize('viewAudit', $reservation);

        return AuditResource::collection(
            $reservation->audits()->latest()->paginate(15)
        );
    }
}
