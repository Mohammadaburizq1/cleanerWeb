import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { AuthService } from './auth.service';
import { jsonStr, jsonStrNull } from './aspnet-json.util';
import { CreateOfferDto, OfferDto, UpdateOfferDto } from './offer.dto';

/**
 * Offer API — OpenAPI cleaning-app v1:
 * `GET|POST /api/Offer`, `GET|PUT|DELETE /api/Offer/{id}`.
 */
@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** GET /api/Offer (no auth). Client keeps only `isActive` and sorts by `sortOrder`. */
  listPublicOffers(): Observable<OfferDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Offer');
    // Cache-bust so admin changes reflect immediately (some hosts/CDNs may cache GETs).
    return this.http
      .get<unknown[]>(url, { params: { _: String(Date.now()) } })
      .pipe(
      map((rows) => (Array.isArray(rows) ? rows.map((r) => this.normalizeOffer(r)) : [])),
      map((list) => list.filter((o) => o.isActive).sort((a, b) => a.sortOrder - b.sortOrder)),
    );
  }

  /** GET /api/Offer with Bearer token (admin sees inactive if backend allows). */
  listAllOffers(): Observable<OfferDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Offer');
    // Cache-bust so CRUD refresh always reflects the latest server state.
    return this.http.get<unknown[]>(url, { headers: this.authHeaders(), params: { _: String(Date.now()) } }).pipe(
      map((rows) => (Array.isArray(rows) ? rows.map((r) => this.normalizeOffer(r)) : [])),
      map((list) => [...list].sort((a, b) => a.sortOrder - b.sortOrder)),
    );
  }

  /** GET /api/Offer/{id} */
  getOffer(id: string): Observable<OfferDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Offer/${encodeURIComponent(id)}`);
    return this.http
      .get<unknown>(url, { headers: this.authHeaders() })
      .pipe(map((raw) => this.normalizeOffer(raw)));
  }

  /** POST /api/Offer — body: CreateOfferDto; response: OfferDto */
  createOffer(dto: CreateOfferDto): Observable<OfferDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Offer');
    const body = this.serializeCreate(dto);
    return this.http
      .post<unknown>(url, body, { headers: this.authHeaders() })
      .pipe(map((raw) => this.normalizeOffer(raw)));
  }

  /** PUT /api/Offer/{id} — body: UpdateOfferDto (OpenAPI uses PUT, not PATCH). */
  updateOffer(id: string, dto: UpdateOfferDto): Observable<OfferDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Offer/${encodeURIComponent(id)}`);
    const body = this.serializeUpdate(dto);
    return this.http.put<unknown>(url, body, { headers: this.authHeaders() }).pipe(
      switchMap((raw) => {
        if (raw != null && typeof raw === 'object') {
          const n = this.normalizeOffer(raw);
          if (n.id) return of(n);
        }
        return this.getOffer(id);
      }),
    );
  }

  /** DELETE /api/Offer/{id} — OpenAPI: 200 OK */
  deleteOffer(id: string): Observable<void> {
    const url = joinUrl(this.apiBaseUrl, `/api/Offer/${encodeURIComponent(id)}`);
    return this.http.delete<void>(url, { headers: this.authHeaders() });
  }

  private normalizeOffer(raw: unknown): OfferDto {
    const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const pick = (camel: string, pascal: string) => o[camel] ?? o[pascal];
    const sortRaw = pick('sortOrder', 'SortOrder');
    const activeRaw = pick('isActive', 'IsActive');
    let sortOrder = 0;
    if (typeof sortRaw === 'number' && !Number.isNaN(sortRaw)) sortOrder = sortRaw;
    else if (sortRaw != null && sortRaw !== '') sortOrder = Number(sortRaw) || 0;
    let isActive = true;
    if (typeof activeRaw === 'boolean') isActive = activeRaw;
    else if (activeRaw === 'false' || activeRaw === false) isActive = false;
    else if (activeRaw === 'true' || activeRaw === true) isActive = true;

    const pctRaw = pick('discountPercent', 'DiscountPercent');
    let discountPercent: number | null = null;
    if (pctRaw != null && pctRaw !== '') {
      const n = typeof pctRaw === 'number' ? pctRaw : Number(pctRaw);
      if (!Number.isNaN(n)) discountPercent = n;
    }

    return {
      id: jsonStr(raw, 'id', 'Id'),
      title: jsonStr(raw, 'title', 'Title'),
      summary: jsonStr(raw, 'summary', 'Summary'),
      detail: jsonStr(raw, 'detail', 'Detail'),
      badge: jsonStrNull(raw, 'badge', 'Badge'),
      discountPercent,
      sortOrder,
      isActive,
    };
  }

  private serializeCreate(dto: CreateOfferDto): Record<string, unknown> {
    const body: Record<string, unknown> = {
      title: dto.title,
      summary: dto.summary,
      detail: dto.detail,
    };
    if (dto.badge !== undefined) body['badge'] = dto.badge === '' ? null : dto.badge;
    if (dto.discountPercent !== undefined) {
      const v = dto.discountPercent;
      body['discountPercent'] =
        v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);
    }
    if (dto.sortOrder !== undefined) body['sortOrder'] = dto.sortOrder;
    if (dto.isActive !== undefined) body['isActive'] = dto.isActive;
    return body;
  }

  private serializeUpdate(dto: UpdateOfferDto): Record<string, unknown> {
    return this.serializeCreate(dto);
  }
}
