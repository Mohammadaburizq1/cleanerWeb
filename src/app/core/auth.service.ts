import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { jsonStr } from './aspnet-json.util';
import { AuthResultDto, LoginDto, MeDto, RefreshTokenRequestDto, RegisterDto } from './auth.dto';

const ACCESS_TOKEN_KEY = 'auth-access-token';
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';

  private readonly _isLoggedIn = signal<boolean>(!!this.loadAccessToken());
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  private readonly _me = signal<MeDto | null>(null);
  readonly me = this._me.asReadonly();

  login(dto: LoginDto): Observable<AuthResultDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Auth/login');
    return this.http.post<AuthResultDto>(url, dto).pipe(
      map((result) => {
        this.handleAuthResult(result);
        return result;
      })
    );
  }

  register(dto: RegisterDto): Observable<AuthResultDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Auth/register');
    return this.http.post<AuthResultDto>(url, dto).pipe(
      map((result) => {
        this.handleAuthResult(result);
        return result;
      })
    );
  }

  refresh(dto?: RefreshTokenRequestDto): Observable<AuthResultDto> {
    const refreshToken = dto?.refreshToken ?? this.loadRefreshToken();
    const body: RefreshTokenRequestDto = { refreshToken: refreshToken ?? '' };

    const url = joinUrl(this.apiBaseUrl, '/api/Auth/refresh');
    return this.http.post<AuthResultDto>(url, body).pipe(
      map((result) => {
        this.handleAuthResult(result);
        return result;
      })
    );
  }

  loadMe(): Observable<MeDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Auth/me');
    const token = this.loadAccessToken();

    return this.http
      .get<unknown>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .pipe(
        map((raw) => {
          const me: MeDto = {
            id: jsonStr(raw, 'id', 'Id'),
            email: jsonStr(raw, 'email', 'Email'),
            fullName: jsonStr(raw, 'fullName', 'FullName'),
            role: jsonStr(raw, 'role', 'Role'),
          };
          this._me.set(me);
          return me;
        })
      );
  }

  logout(): void {
    this.clearAuth();
  }

  /**
   * Clear auth + all client-side state and return to a clean session.
   * Use this when the backend reports 401/expired token.
   */
  clearClientSession(): void {
    this.clearAuth();

    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // User explicitly asked to clear "cookies" as well (best-effort; HttpOnly cookies cannot be cleared by JS).
    try {
      const cookies = (document.cookie ?? '')
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean);
      for (const c of cookies) {
        const eq = c.indexOf('=');
        const name = (eq >= 0 ? c.slice(0, eq) : c).trim();
        if (!name) continue;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    } catch {
      // ignore
    }

    // Clear remaining local storage keys (after we removed auth keys above).
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  }

  getAccessToken(): string | null {
    return this.loadAccessToken();
  }

  /**
   * Best-effort role extraction from the JWT access token.
   * This is used as a UI fallback in case `/api/Auth/me` does not include `role`.
   */
  getRoleFromAccessToken(): string {
    const token = this.loadAccessToken();
    if (!token) return '';
    const payload = this.parseJwtPayload(token);
    if (!payload) return '';

    const candidates: unknown[] = [
      payload['role'],
      payload['roles'],
      // Common ASP.NET role claim URI
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    ];

    for (const c of candidates) {
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) {
        const first = c.find((x) => typeof x === 'string') as string | undefined;
        if (first) return first;
      }
    }
    return '';
  }

  private handleAuthResult(result: AuthResultDto): void {
    if (result && result.success && result.accessToken) {
      this.saveTokens(result.accessToken, result.refreshToken ?? null);
      this._isLoggedIn.set(true);
    } else {
      this.clearAuth();
    }
  }

  private parseJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    try {
      // base64url → base64
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
      const json = decodeURIComponent(
        Array.from(atob(b64))
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
      const obj = JSON.parse(json) as unknown;
      return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private saveTokens(accessToken: string, refreshToken: string | null): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._isLoggedIn.set(false);
    this._me.set(null);
  }

  private loadAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private loadRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
}

