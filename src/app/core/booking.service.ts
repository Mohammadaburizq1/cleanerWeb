import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { AuthService } from './auth.service';
import { jsonStr, jsonStrNull } from './aspnet-json.util';
import { BookingDto, CreateBookingDto } from './booking.dto';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  listBookings(): Observable<BookingDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Booking');
    return this.http
      .get<unknown[]>(url, { headers: this.authHeaders() })
      .pipe(map((rows) => (Array.isArray(rows) ? rows.map((r) => this.normalizeBooking(r)) : [])));
  }

  getBooking(id: string): Observable<BookingDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Booking/${id}`);
    return this.http
      .get<unknown>(url, { headers: this.authHeaders() })
      .pipe(map((raw) => this.normalizeBooking(raw)));
  }

  /** POST /api/Booking — body is CreateBookingDto (flat, per OpenAPI). */
  createBooking(dto: CreateBookingDto): Observable<BookingDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Booking');
    return this.http
      .post<unknown>(url, dto, { headers: this.authHeaders() })
      .pipe(map((raw) => this.normalizeBooking(raw)));
  }

  private normalizeBooking(raw: unknown): BookingDto {
    return {
      id: jsonStr(raw, 'id', 'Id'),
      serviceId: jsonStr(raw, 'serviceId', 'ServiceId'),
      date: jsonStr(raw, 'date', 'Date'),
      address: jsonStr(raw, 'address', 'Address'),
      notes: jsonStrNull(raw, 'notes', 'Notes'),
      status: jsonStr(raw, 'status', 'Status'),
    };
  }
}
