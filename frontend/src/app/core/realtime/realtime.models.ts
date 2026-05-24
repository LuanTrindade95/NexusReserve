import { Reservation } from '@app/features/reservations/reservations.models';

export interface ReservationStatusChangedPayload {
  reservation: Reservation;
  status_log: {
    id: number;
    reservation_id: number;
    from_status: string;
    to_status: string;
    changed_by: number | null;
    note: string | null;
    created_at: string;
  };
}

export interface ResourceAvailabilityChangedPayload {
  resource_id: number;
  reservation_id: number;
  status: string;
  changed_at: string;
}

export interface BroadcastNotificationPayload {
  title: string;
  message: string;
  reservation_id?: number;
  resource_id?: number;
  resource_name?: string | null;
  status?: string;
  note?: string | null;
}
