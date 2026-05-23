import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '@app/core/api/api.config';
import { LoginCredentials, LoginResponse, UserResponse } from '@app/core/auth/auth.models';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private accessToken: string | null = null;

  readonly currentUser = signal<LoginResponse['user'] | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null && this.accessToken !== null);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.accessToken = response.token;
        this.currentUser.set(response.user);
      }),
    );
  }

  loadCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiBaseUrl}/auth/me`).pipe(
      tap((response) => this.currentUser.set(response.data)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.accessToken = null;
    this.currentUser.set(null);
  }

  token(): string | null {
    return this.accessToken;
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }
}
