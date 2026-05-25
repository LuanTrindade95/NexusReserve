import { HttpParams } from '@angular/common/http';

export type ResourceStatus = 'active' | 'maintenance' | 'retired';

export interface ResourceType {
  id: number;
  name: string;
  slug: string;
  icon: string;
  requires_approval: boolean;
  max_duration_minutes: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  resource_type_id: number;
  resource_type: ResourceType | null;
  name: string;
  code: string;
  description: string | null;
  location: string;
  capacity: number | null;
  status: ResourceStatus;
  metadata: Record<string, unknown> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceBlackout {
  id: number;
  resource_id: number;
  starts_at: string;
  ends_at: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: number;
  event: string;
  auditable_type: string;
  auditable_id: number;
  user_type: string | null;
  user_id: number | null;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ResourceTypePayload {
  name: string;
  slug: string;
  icon: string;
  requires_approval: boolean;
  max_duration_minutes: number;
  color: string;
}

export interface ResourcePayload {
  resource_type_id: number;
  name: string;
  code: string;
  description: string | null;
  location: string;
  capacity: number | null;
  status: ResourceStatus;
  metadata: Record<string, unknown> | null;
}

export interface ResourceBlackoutPayload {
  starts_at: string;
  ends_at: string;
  reason: string;
}

export interface ResourceFilters {
  type?: string;
  status?: ResourceStatus;
  location?: string;
  search?: string;
  sort?: 'name' | 'code' | 'status' | 'location' | 'created_at';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ResourceTypeFilters {
  search?: string;
  requires_approval?: boolean;
  sort?: 'name' | 'slug' | 'created_at';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export function paramsFromRecord(values: object): HttpParams {
  let params = new HttpParams();

  Object.entries(values).forEach(([key, value]) => {
    if (
      (typeof value === 'string' && value !== '')
      || typeof value === 'number'
      || typeof value === 'boolean'
    ) {
      params = params.set(key, String(value));
    }
  });

  return params;
}
