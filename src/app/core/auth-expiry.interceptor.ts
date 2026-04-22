import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let handlingAuthExpiry = false;

/**
 * If backend returns 401, assume token expired/invalid:
 * clear client session + redirect to Home.
 */
export const authExpiryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const res = err instanceof HttpErrorResponse ? err : null;
      const status = res?.status ?? 0;

      // Avoid loops and avoid interfering with auth endpoints themselves.
      const url = req.urlWithParams || '';
      const isAuthEndpoint = /\/api\/Auth\/(login|register|refresh|me)\b/i.test(url);

      if (!handlingAuthExpiry && status === 401 && !isAuthEndpoint) {
        handlingAuthExpiry = true;
        try {
          auth.clearClientSession();
        } finally {
          // Use navigation (and also hard-reload fallback) to guarantee a clean state.
          router.navigateByUrl('/').finally(() => {
            setTimeout(() => {
              try {
                if (location.pathname !== '/') location.assign('/');
                else location.reload();
              } catch {
                // ignore
              } finally {
                handlingAuthExpiry = false;
              }
            }, 50);
          });
        }
      }

      return throwError(() => err);
    }),
  );
};

