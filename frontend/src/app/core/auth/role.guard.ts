import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';

export function roleGuard(role: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (auth.hasRole(role)) {
      return true;
    }

    toast.error('Access denied', 'Your account does not include the required role.');

    return router.createUrlTree(['/']);
  };
}
