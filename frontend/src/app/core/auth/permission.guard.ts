import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (auth.hasPermission(permission)) {
      return true;
    }

    toast.error('Access denied', 'Your account does not include the required permission.');

    return router.createUrlTree(['/']);
  };
}
