import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { AuthService } from './auth.service';
import { jsonStr, jsonStrNull } from './aspnet-json.util';
import { ClosedDayDto, CreateClosedDayDto } from './closed-days.dto';

const LOCAL_STORAGE_KEY = 'cleaning-site.closedDays';

/**
 * Closed booking days — OpenAPI-style:
 * `GET|POST /api/ClosedDays`, `DELETE /api/ClosedDays/{id}`.
 * Falls back to localStorage when the API is unavailable (dev/demo).
 */
@Injectable({ providedIn: 'root' })
export class ClosedDaysService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** GET /api/ClosedDays (no auth) — dates when booking is not allowed. */
  listPublicClosedDays(): Observable<ClosedDayDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/ClosedDays');
    return this.http
      .get<unknown[]>(url, { params: { _: String(Date.now()) } })
      .pipe(
        map((rows) => this.normalizeList(rows)),
        catchError((err) => this.fallbackOnMissingApi(err, () => this.readLocal())),
      );
  }

  /** GET /api/ClosedDays with Bearer token (admin). */
  listAllClosedDays(): Observable<ClosedDayDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/ClosedDays');
    return this.http
      .get<unknown[]>(url, { headers: this.authHeaders(), params: { _: String(Date.now()) } })
      .pipe(
        map((rows) => this.normalizeList(rows)),
        catchError((err) => this.fallbackOnMissingApi(err, () => this.readLocal())),
      );
  }

  /** POST /api/ClosedDays — body: CreateClosedDayDto */
  createClosedDay(dto: CreateClosedDayDto): Observable<ClosedDayDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/ClosedDays');
    const body = {
      date: dto.date,
      reason: dto.reason === '' ? null : (dto.reason ?? null),
    };
    return this.http.post<unknown>(url, body, { headers: this.authHeaders() }).pipe(
      map((raw) => this.normalizeOne(raw)),
      catchError((err) =>
        this.fallbackOnMissingApi(err, () => {
          const created = this.createLocal(dto);
          return created;
        }),
      ),
    );
  }

  /** DELETE /api/ClosedDays/{id} */
  deleteClosedDay(id: string): Observable<void> {
    const url = joinUrl(this.apiBaseUrl, `/api/ClosedDays/${encodeURIComponent(id)}`);
    return this.http.delete<void>(url, { headers: this.authHeaders() }).pipe(
      catchError((err) =>
        this.fallbackOnMissingApi(err, () => {
          this.deleteLocal(id);
          return undefined;
        }),
      ),
      switchMap(() => of(undefined)),
    );
  }

  private normalizeList(rows: unknown): ClosedDayDto[] {
    const list = Array.isArray(rows) ? rows.map((r) => this.normalizeOne(r)) : [];
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }

  private normalizeOne(raw: unknown): ClosedDayDto {
    const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const pick = (camel: string, pascal: string) => o[camel] ?? o[pascal];
    const dateRaw = pick('date', 'Date');
    let date = '';
    if (typeof dateRaw === 'string') {
      date = dateRaw.slice(0, 10);
    } else if (dateRaw != null) {
      const d = new Date(String(dateRaw));
      if (!isNaN(d.getTime())) {
        date = this.dateToYmd(d);
      }
    }
    return {
      id: jsonStr(raw, 'id', 'Id'),
      date,
      reason: jsonStrNull(raw, 'reason', 'Reason'),
    };
  }

  private dateToYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private fallbackOnMissingApi<T>(err: unknown, fallback: () => T): Observable<T> {
    if (this.isApiUnavailable(err)) return of(fallback());
    return throwError(() => err);
  }

  private isApiUnavailable(err: unknown): boolean {
    if (!(err instanceof HttpErrorResponse)) return true;
    if (err.status === 0 || err.status === 404) return true;
    return false;
  }

  private readLocal(): ClosedDayDto[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return this.normalizeList(parsed);
    } catch {
      return [];
    }
  }

  private writeLocal(rows: ClosedDayDto[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // ignore quota / private mode
    }
  }

  private createLocal(dto: CreateClosedDayDto): ClosedDayDto {
    const rows = this.readLocal();
    const date = dto.date.slice(0, 10);
    const existing = rows.find((r) => r.date === date);
    if (existing) return existing;
    const created: ClosedDayDto = {
      id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
      date,
      reason: dto.reason === '' ? null : (dto.reason ?? null),
    };
    this.writeLocal([...rows, created]);
    return created;
  }

  private deleteLocal(id: string): void {
    this.writeLocal(this.readLocal().filter((r) => r.id !== id));
  }
}
