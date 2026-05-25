import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@app/core/api/api.config';
import { ApiPage, ApiResource } from '@app/core/api/pagination.models';
import { paramsFromRecord } from '@app/features/resource-management/resources.models';
import {
  RejectPayload,
  Reservation,
  ReservationFilters,
  ReservationPayload,
  TransitionPayload,
} from '@app/features/reservations/reservations.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listReservations(filters: ReservationFilters = {}): Observable<ApiPage<Reservation>> {
    return this.http.get<ApiPage<Reservation>>(`${this.apiBaseUrl}/reservations`, {
      params: paramsFromRecord(filters),
    });
  }

  getReservation(id: number): Observable<ApiResource<Reservation>> {
    return this.http.get<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}`);
  }

  createReservation(payload: ReservationPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations`, payload);
  }

  updateReservation(id: number, payload: ReservationPayload): Observable<ApiResource<Reservation>> {
    return this.http.put<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}`, payload);
  }

  approve(id: number, payload: TransitionPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}/approve`, payload);
  }

  reject(id: number, payload: RejectPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}/reject`, payload);
  }

  checkOut(id: number, payload: TransitionPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}/check-out`, payload);
  }

  returnReservation(id: number, payload: TransitionPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}/return`, payload);
  }

  cancel(id: number, payload: TransitionPayload): Observable<ApiResource<Reservation>> {
    return this.http.post<ApiResource<Reservation>>(`${this.apiBaseUrl}/reservations/${id}/cancel`, payload);
  }
}
