import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[HTTP] Request:', {
    method: req.method,
    url: req.urlWithParams,
    headers: req.headers,
    body: req.body,
  });

  const started = Date.now();

  return next(req).pipe(
    tap({
      next: (event) => {
        const elapsed = Date.now() - started;
        console.log('[HTTP] Response:', {
          method: req.method,
          url: req.urlWithParams,
          elapsedMs: elapsed,
          event,
        });
      },
      error: (error) => {
        const elapsed = Date.now() - started;
        console.error('[HTTP] Error:', {
          method: req.method,
          url: req.urlWithParams,
          elapsedMs: elapsed,
          error,
        });
      },
    })
  );
};


