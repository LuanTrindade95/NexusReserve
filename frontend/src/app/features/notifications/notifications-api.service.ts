import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@app/core/api/api.config';
import { ApiPage, ApiResource } from '@app/core/api/pagination.models';
import { AppNotification } from '@app/features/notifications/notifications.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listNotifications(): Observable<ApiPage<AppNotification>> {
    return this.http.get<ApiPage<AppNotification>>(`${this.apiBaseUrl}/notifications`, {
      params: { per_page: 20 },
    });
  }

  markAsRead(id: string): Observable<ApiResource<AppNotification>> {
    return this.http.post<ApiResource<AppNotification>>(`${this.apiBaseUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/notifications/read-all`, {});
  }
}
