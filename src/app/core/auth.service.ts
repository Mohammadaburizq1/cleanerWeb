import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL, joinUrl } from './api-base-url';
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
      .get<MeDto>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .pipe(
        map((me) => {
          console.log(me,"---------me");
          this._me.set(me);
          return me;
        })
      );
  }

  logout(): void {
    this.clearAuth();
  }

  getAccessToken(): string | null {
    return this.loadAccessToken();
  }

  private handleAuthResult(result: AuthResultDto): void {
    if (result && result.success && result.accessToken) {
      this.saveTokens(result.accessToken, result.refreshToken ?? null);
      this._isLoggedIn.set(true);
    } else {
      this.clearAuth();
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

