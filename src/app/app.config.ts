import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/api-base-url';
import { loggingInterceptor } from './core/logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loggingInterceptor])),
    // Point frontend API calls to backend from OpenAPI (http://localhost:5073/)
    { provide: API_BASE_URL, useValue: 'http://localhost:5073' },
  ],
};