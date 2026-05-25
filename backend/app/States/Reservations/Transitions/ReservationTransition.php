<?php

namespace App\States\Reservations\Transitions;

use App\Events\ReservationStatusChanged;
use App\Models\Reservation;
use App\States\Reservations\ReservationStatus;
use Spatie\ModelStates\Transition;

abstract class ReservationTransition extends Transition
{
    public function __construct(
        protected Reservation $reservation,
        protected ?int $changedBy = null,
        protected ?string $note = null,
    ) {}

    abstract protected function targetState(): string;

    public function handle(): Reservation
    {
        $fromStatus = $this->reservation->status->getValue();
        $targetState = $this->targetState();
        /** @var class-string<ReservationStatus> $targetState */
        $toStatus = $targetState::getMorphClass();

        $this->applyStateMetadata();

        $this->reservation->status = $targetState;
        $this->reservation->save();

        $statusLog = $this->reservation->statusLogs()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changed_by' => $this->changedBy,
            'note' => $this->note,
        ]);

        $this->reservation->refresh();

        ReservationStatusChanged::dispatch($this->reservation, $statusLog);

        return $this->reservation;
    }

    protected function applyStateMetadata(): void {}
}
