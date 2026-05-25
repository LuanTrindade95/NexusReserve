import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@app/core/api/api.config';
import { LoginResponse } from '@app/core/auth/auth.models';
import { AuthService } from '@app/core/auth/auth.service';

describe('AuthService', () => {
  const apiBaseUrl = 'http://api.test/api/v1';
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: apiBaseUrl },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('stores the authenticated user and in-memory token on login success', () => {
    const response: LoginResponse = {
      token_type: 'Bearer',
      token: 'token-value',
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@demo',
        department_id: 1,
        roles: ['admin'],
        permissions: ['resources.manage'],
      },
    };

    service.login({ email: 'admin@demo', password: 'password' }).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const request = http.expectOne(`${apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush(response);

    expect(service.currentUser()).toEqual(response.user);
    expect(service.token()).toBe('token-value');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('keeps the session empty when login fails', () => {
    let capturedStatus: number | null = null;

    service.login({ email: 'admin@demo', password: 'wrong' }).subscribe({
      error: (error: HttpErrorResponse) => {
        capturedStatus = error.status;
      },
    });

    const request = http.expectOne(`${apiBaseUrl}/auth/login`);
    request.flush({ message: 'Invalid credentials.', code: 'auth.invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedStatus).toBe(401);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
