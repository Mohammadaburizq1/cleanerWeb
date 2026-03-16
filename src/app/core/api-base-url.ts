import { InjectionToken } from '@angular/core';

/**
 * Base URL for backend API calls.
 *
 * Default is empty string, meaning same-origin relative URLs like `/api/...`.
 * Override in `app.config.ts` if your API is on a different host.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export function joinUrl(base: string, path: string): string {
  const b = (base ?? '').replace(/\/+$/, '');
  const p = (path ?? '').replace(/^\/+/, '');
  if (!b) return `/${p}`;
  return `${b}/${p}`;
}

