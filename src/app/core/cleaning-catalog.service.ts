import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { jsonStr } from './aspnet-json.util';
import { AuthService } from './auth.service';
import { ServiceDto } from './booking.dto';

@Injectable({ providedIn: 'root' })
export class CleaningCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  /** GET /api/Service */
  getServices(): Observable<ServiceDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Service');
    const token = this.auth.getAccessToken();
    return this.http
      .get<unknown[]>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .pipe(map((rows) => (Array.isArray(rows) ? rows.map((r) => this.normalizeService(r)) : [])));
  }

  private normalizeService(raw: unknown): ServiceDto {
    if (!raw || typeof raw !== 'object') {
      return { id: '', name: '', description: '', price: 0 };
    }
    const o = raw as Record<string, unknown>;
    const price = o['price'] ?? o['Price'];
    return {
      id: jsonStr(raw, 'id', 'Id'),
      name: jsonStr(raw, 'name', 'Name'),
      description: jsonStr(raw, 'description', 'Description'),
      price: price == null ? 0 : (typeof price === 'number' || typeof price === 'string' ? price : String(price)),
    };
  }
}
