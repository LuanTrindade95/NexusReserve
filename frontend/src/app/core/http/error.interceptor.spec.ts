import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { errorInterceptor } from '@app/core/http/error.interceptor';
import { ToastService } from '@app/core/toast/toast.service';

describe('errorInterceptor', () => {
  let http: HttpTestingController;
  let auth: Pick<AuthService, 'clearSession'>;
  let router: Pick<Router, 'navigate'>;

  beforeEach(() => {
    auth = {
      clearSession: jest.fn(),
    };
    router = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: { error: jest.fn() } satisfies Pick<ToastService, 'error'> },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('clears the session and redirects to login on 401', () => {
    TestBed.inject(HttpClient).get('/secure').subscribe({
      error: () => undefined,
    });

    http.expectOne('/secure').flush(
      { message: 'Unauthenticated.', code: 'auth.unauthenticated' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
