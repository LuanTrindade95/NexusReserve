import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiErrorPayload, FormValidationError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function parsePayload(error: HttpErrorResponse): ApiErrorPayload | null {
  if (typeof error.error === 'object' && error.error !== null && 'message' in error.error && 'code' in error.error) {
    return error.error as ApiErrorPayload;
  }

  return null;
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const payload = parsePayload(error);

      if (error.status === 401) {
        auth.clearSession();
        void router.navigate(['/login']);

        return throwError(() => error);
      }

      if (error.status === 403) {
        toast.error('Access denied', payload?.message ?? 'You do not have permission to perform this action.');
      }

      const validationErrors = payload?.errors;

      if (error.status === 422 && validationErrors) {
        return throwError(() => new FormValidationError(validationErrors));
      }

      if (error.status >= 500) {
        toast.error('Service unavailable', 'The request could not be completed. Try again shortly.');
      }

      return throwError(() => error);
    }),
  );
};
