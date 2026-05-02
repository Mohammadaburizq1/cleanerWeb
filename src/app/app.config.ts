import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/api-base-url';
import { loggingInterceptor } from './core/logging.interceptor';
import { authBearerInterceptor } from './core/auth-bearer.interceptor';
import { authExpiryInterceptor } from './core/auth-expiry.interceptor';
import { noCacheInterceptor } from './core/no-cache.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loggingInterceptor, noCacheInterceptor, authBearerInterceptor, authExpiryInterceptor]),
    ),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
  ],
};