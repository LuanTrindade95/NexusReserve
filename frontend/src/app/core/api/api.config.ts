import { InjectionToken } from '@angular/core';

declare global {
  interface Window {
    nexusReserveApiBaseUrl?: string;
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => globalThis.window?.nexusReserveApiBaseUrl ?? '/api/v1',
});
