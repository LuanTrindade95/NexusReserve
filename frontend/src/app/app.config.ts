import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '@app/core/http/auth.interceptor';
import { errorInterceptor } from '@app/core/http/error.interceptor';
import { loadingInterceptor } from '@app/core/http/loading.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])),
  ],
};
