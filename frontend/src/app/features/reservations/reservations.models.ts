import { AuthUser } from '@app/core/auth/auth.models';
import { Resource } from '@app/features/resource-management/resources.models';

export type ReservationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'checked_out' | 'returned' | 'cancelled';

export interface ReservationStatusLog {
  id: number;
  reservation_id: number;
  from_status: ReservationStatus;
  to_status: ReservationStatus;
  changed_by: number | null;
  note: string | null;
  created_at: string;
}

export interface Reservation {
  id: number;
  resource_id: number;
  resource: Resource | null;
  user_id: number;
  user: AuthUser | null;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  purpose: string;
  approved_by: number | null;
  approver: AuthUser | null;
  approved_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  status_logs: readonly ReservationStatusLog[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationPayload {
  resource_id: number;
  starts_at: string;
  ends_at: string;
  purpose: string;
}

export interface ReservationFilters {
  resource_id?: number;
  mine?: boolean;
  user_id?: number;
  status?: ReservationStatus;
  starts_from?: string;
  ends_until?: string;
  search?: string;
  sort?: 'starts_at' | 'ends_at' | 'status' | 'created_at';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface TransitionPayload {
  note?: string | null;
}

export interface RejectPayload {
  reason: string;
}
