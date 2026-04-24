import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Prevent stale "list" data in production environments (CDN/proxy/browser caching).
 * Applies to all GET requests by:
 * - adding a cache-busting query param
 * - setting Cache-Control/Pragma headers (best-effort; some caches ignore request headers)
 */
export const noCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method.toUpperCase() !== 'GET') return next(req);

  const url = req.urlWithParams || req.url;
  // Skip cache-busting for static assets.
  if (/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|map)(\?|$)/i.test(url)) return next(req);

  const busted = req.clone({
    setHeaders: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    setParams: {
      _: String(Date.now()),
    },
  });

  return next(busted);
};

