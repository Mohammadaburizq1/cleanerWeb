import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let handlingAuthExpiry = false;

/**
 * Handles 401 Unauthorized from the API:
 * - Login/register: do nothing (wrong credentials must not wipe session).
 * - `/api/Auth/me` or `/api/Auth/refresh`: clear stored tokens only (expired/invalid JWT).
 * - Other API calls: full session clear + redirect home (protected resource rejected).
 */
export const authExpiryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const res = err instanceof HttpErrorResponse ? err : null;
      const status = res?.status ?? 0;
      const url = req.urlWithParams || '';

      const isLoginOrRegister = /\/api\/Auth\/(login|register)\b/i.test(url);
      const isMe = /\/api\/Auth\/me\b/i.test(url);
      const isRefresh = /\/api\/Auth\/refresh\b/i.test(url);

      if (status !== 401) {
        return throwError(() => err);
      }

      // Wrong password / duplicate email — never clear an existing session.
      if (isLoginOrRegister) {
        return throwError(() => err);
      }

      // Expired access token on profile load, or refresh token rejected — drop auth state quietly.
      if (isMe || isRefresh) {
        auth.logout();
        return throwError(() => err);
      }

      if (!handlingAuthExpiry) {
        handlingAuthExpiry = true;
        try {
          auth.clearClientSession();
        } finally {
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

