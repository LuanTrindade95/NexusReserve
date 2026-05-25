import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@app/core/api/api.config';
import { ApiPage, ApiResource } from '@app/core/api/pagination.models';
import {
  AuditEntry,
  paramsFromRecord,
  Resource,
  ResourceBlackout,
  ResourceBlackoutPayload,
  ResourceFilters,
  ResourcePayload,
  ResourceType,
  ResourceTypeFilters,
  ResourceTypePayload,
} from '@app/features/resource-management/resources.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ResourcesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listResourceTypes(filters: ResourceTypeFilters = {}): Observable<ApiPage<ResourceType>> {
    return this.http.get<ApiPage<ResourceType>>(`${this.apiBaseUrl}/resource-types`, {
      params: paramsFromRecord(filters),
    });
  }

  createResourceType(payload: ResourceTypePayload): Observable<ApiResource<ResourceType>> {
    return this.http.post<ApiResource<ResourceType>>(`${this.apiBaseUrl}/resource-types`, payload);
  }

  updateResourceType(id: number, payload: ResourceTypePayload): Observable<ApiResource<ResourceType>> {
    return this.http.put<ApiResource<ResourceType>>(`${this.apiBaseUrl}/resource-types/${id}`, payload);
  }

  deleteResourceType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/resource-types/${id}`);
  }

  listResources(filters: ResourceFilters = {}): Observable<ApiPage<Resource>> {
    return this.http.get<ApiPage<Resource>>(`${this.apiBaseUrl}/resources`, {
      params: paramsFromRecord(filters),
    });
  }

  getResource(id: number): Observable<ApiResource<Resource>> {
    return this.http.get<ApiResource<Resource>>(`${this.apiBaseUrl}/resources/${id}`);
  }

  createResource(payload: ResourcePayload): Observable<ApiResource<Resource>> {
    return this.http.post<ApiResource<Resource>>(`${this.apiBaseUrl}/resources`, payload);
  }

  updateResource(id: number, payload: ResourcePayload): Observable<ApiResource<Resource>> {
    return this.http.put<ApiResource<Resource>>(`${this.apiBaseUrl}/resources/${id}`, payload);
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/resources/${id}`);
  }

  restoreResource(id: number): Observable<ApiResource<Resource>> {
    return this.http.post<ApiResource<Resource>>(`${this.apiBaseUrl}/resources/${id}/restore`, {});
  }

  listAudits(id: number): Observable<ApiPage<AuditEntry>> {
    return this.http.get<ApiPage<AuditEntry>>(`${this.apiBaseUrl}/resources/${id}/audits`);
  }

  listBlackouts(id: number): Observable<ApiPage<ResourceBlackout>> {
    return this.http.get<ApiPage<ResourceBlackout>>(`${this.apiBaseUrl}/resources/${id}/blackouts`);
  }

  createBlackout(resourceId: number, payload: ResourceBlackoutPayload): Observable<ApiResource<ResourceBlackout>> {
    return this.http.post<ApiResource<ResourceBlackout>>(`${this.apiBaseUrl}/resources/${resourceId}/blackouts`, payload);
  }

  deleteBlackout(resourceId: number, blackoutId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/resources/${resourceId}/blackouts/${blackoutId}`);
  }
}
