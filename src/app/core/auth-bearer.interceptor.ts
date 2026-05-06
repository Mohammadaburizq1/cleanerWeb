import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from './api-base-url';
import { AuthService } from './auth.service';

/**
 * Attaches `Authorization: Bearer <access_token>` to API requests when a token exists.
 * Public auth endpoints (login, register, forgot/reset password) are skipped so stale tokens
 * are never sent there.
 */
export const authBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const token = auth.getAccessToken();
  if (!token) {
    return next(req);
  }

  const url = req.url;
  const targetsApi =
    (apiBaseUrl && url.startsWith(apiBaseUrl.replace(/\/+$/, ''))) ||
    (!apiBaseUrl && url.includes('/api/'));

  if (!targetsApi) {
    return next(req);
  }

  // Public endpoints: never attach stale/invalid tokens.
  const publicNoBearer =
    /\/api\/Auth\/(login|register|forgot-password|reset-password|email-available)\b/i.test(url) ||
    /\/api\/Feedback\b/i.test(url);
  if (publicNoBearer) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
