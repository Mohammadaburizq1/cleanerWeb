import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { AuthService } from './auth.service';
import { CreateFeedbackDto, FeedbackDto } from './feedback.dto';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** POST /api/Feedback */
  createFeedback(dto: CreateFeedbackDto): Observable<FeedbackDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/Feedback');
    return this.http.post<FeedbackDto>(url, dto, { headers: this.authHeaders() });
  }

  /** GET /api/Feedback?userId&bookingId */
  getFeedback(params?: { userId?: string; bookingId?: string }): Observable<FeedbackDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Feedback');
    const query: Record<string, string> = {};
    if (params?.userId) query['userId'] = params.userId;
    if (params?.bookingId) query['bookingId'] = params.bookingId;
    return this.http.get<FeedbackDto[]>(url, { params: query, headers: this.authHeaders() });
  }

  /** GET /api/Feedback/{id} */
  getFeedbackById(id: string): Observable<FeedbackDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Feedback/${id}`);
    return this.http.get<FeedbackDto>(url, { headers: this.authHeaders() });
  }
}
