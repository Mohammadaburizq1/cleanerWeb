import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { AuthService } from './auth.service';
import { CreateQuoteRequestDto, QuoteDto } from './quote.dto';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** POST /api/Quote */
  submitQuote(dto: CreateQuoteRequestDto): Observable<QuoteDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Quote');
    return this.http.post<QuoteDto>(url, dto);
  }

  /** GET /api/Quote */
  listQuotes(): Observable<QuoteDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Quote');
    return this.http.get<QuoteDto[]>(url, { headers: this.authHeaders() });
  }

  /** GET /api/Quote/{id} */
  getQuote(id: string): Observable<QuoteDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Quote/${id}`);
    return this.http.get<QuoteDto>(url, { headers: this.authHeaders() });
  }
}
