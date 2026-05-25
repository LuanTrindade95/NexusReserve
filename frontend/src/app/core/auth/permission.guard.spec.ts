import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { permissionGuard } from '@app/core/auth/permission.guard';
import { ToastService } from '@app/core/toast/toast.service';

describe('permissionGuard', () => {
  function runGuard(permission: string): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => {
      return permissionGuard(permission)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as boolean | UrlTree;
    });
  }

  it('blocks navigation when the user lacks the required permission', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasPermission: () => false } satisfies Pick<AuthService, 'hasPermission'> },
        { provide: ToastService, useValue: { error: jest.fn() } satisfies Pick<ToastService, 'error'> },
      ],
    });

    const result = runGuard('resources.manage');

    expect(result instanceof UrlTree).toBe(true);
  });

  it('allows navigation when the user has the required permission', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasPermission: () => true } satisfies Pick<AuthService, 'hasPermission'> },
        { provide: ToastService, useValue: { error: jest.fn() } satisfies Pick<ToastService, 'error'> },
      ],
    });

    expect(runGuard('resources.manage')).toBe(true);
    expect(TestBed.inject(Router)).toBeTruthy();
  });
});
