import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { jsonStr, jsonStrNull } from './aspnet-json.util';
import { AuthService } from './auth.service';
import {
  ConfirmStripePaymentRequest,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CancelSubscriptionDto,
  CancelSubscriptionResponseDto,
  CreateSubscriptionCheckoutDto,
  CreateSubscriptionCheckoutResponseDto,
  PaymentDto,
} from './payments.dto';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly auth = inject(AuthService);

  private authHeaders(): Record<string, string> {
    const token = this.auth.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** POST /api/stripe/create-subscription-checkout — Stripe Billing checkout session URL. */
  createSubscriptionCheckout(
    dto: CreateSubscriptionCheckoutDto,
  ): Observable<CreateSubscriptionCheckoutResponseDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/stripe/create-subscription-checkout');
    return this.http.post<unknown>(url, dto, { headers: this.authHeaders() }).pipe(
      map((raw) => ({
        checkoutUrl: jsonStr(raw, 'checkoutUrl', 'CheckoutUrl'),
      })),
    );
  }

  /** POST /api/stripe/cancel-subscription — cancel Stripe subscription linked to a booking. */
  cancelSubscription(dto: CancelSubscriptionDto): Observable<CancelSubscriptionResponseDto> {
    const url = joinUrl(this.apiBaseUrl, '/api/stripe/cancel-subscription');
    const body: CancelSubscriptionDto = {
      customerId: dto.customerId,
      bookingId: dto.bookingId,
      ...(dto.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: dto.cancelAtPeriodEnd } : {}),
    };
    return this.http.post<unknown>(url, body, { headers: this.authHeaders() }).pipe(
      map((raw) => ({
        cancelAtPeriodEnd:
          typeof (raw as { cancelAtPeriodEnd?: unknown })?.cancelAtPeriodEnd === 'boolean'
            ? (raw as { cancelAtPeriodEnd: boolean }).cancelAtPeriodEnd
            : false,
        message: jsonStr(raw, 'message', 'Message'),
      })),
    );
  }

  /** POST /api/Payments — flat CreatePaymentRequest (OpenAPI). */
  createPayment(dto: CreatePaymentRequest): Observable<CreatePaymentResponse> {
    const url = joinUrl(this.apiBaseUrl, '/api/Payments');
    return this.http
      .post<unknown>(url, dto, { headers: this.authHeaders() })
      .pipe(map((raw) => this.normalizeCreatePaymentResponse(raw)));
  }

  private normalizeCreatePaymentResponse(raw: unknown): CreatePaymentResponse {
    return {
      paymentId: jsonStr(raw, 'paymentId', 'PaymentId'),
      providerPaymentId: jsonStrNull(raw, 'providerPaymentId', 'ProviderPaymentId'),
      clientSecret: jsonStrNull(raw, 'clientSecret', 'ClientSecret'),
      status: jsonStr(raw, 'status', 'Status'),
      createdAt: jsonStr(raw, 'createdAt', 'CreatedAt'),
    };
  }

  /** GET /api/Payments */
  listPayments(): Observable<PaymentDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Payments');
    return this.http.get<PaymentDto[]>(url, { headers: this.authHeaders() });
  }

  /** GET /api/Payments/stripe?limit= */
  listStripePayments(limit = 20): Observable<PaymentDto[]> {
    const url = joinUrl(this.apiBaseUrl, '/api/Payments/stripe');
    return this.http.get<PaymentDto[]>(url, {
      headers: this.authHeaders(),
      params: { limit: String(limit) },
    });
  }

  /** GET /api/Payments/{paymentId} */
  getPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}`);
    return this.http.get<PaymentDto>(url, { headers: this.authHeaders() });
  }

  /** POST /api/Payments/stripe/{providerPaymentId}/confirm */
  confirmStripePayment(providerPaymentId: string, paymentMethodToken: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/stripe/${encodeURIComponent(providerPaymentId)}/confirm`);
    const body: ConfirmStripePaymentRequest = { paymentMethodToken };
    return this.http.post<PaymentDto>(url, body, { headers: this.authHeaders() });
  }

  /** POST /api/Payments/stripe/{providerPaymentId}/accept */
  acceptStripeProviderPayment(providerPaymentId: string): Observable<PaymentDto> {
    const url = joinUrl(
      this.apiBaseUrl,
      `/api/Payments/stripe/${encodeURIComponent(providerPaymentId)}/accept`,
    );
    return this.http.post<PaymentDto>(url, {}, { headers: this.authHeaders() });
  }

  /** POST /api/Payments/{paymentId}/accept */
  acceptPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/accept`);
    return this.http.post<PaymentDto>(url, {}, { headers: this.authHeaders() });
  }

  /** POST /api/Payments/{paymentId}/reject */
  rejectPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/reject`);
    return this.http.post<PaymentDto>(url, {}, { headers: this.authHeaders() });
  }

  /** POST /api/Payments/{paymentId}/refund */
  refundPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/refund`);
    return this.http.post<PaymentDto>(url, {}, { headers: this.authHeaders() });
  }

  /**
   * DELETE /api/Payments/{paymentId}
   * Note: Not present in the current OpenAPI snapshot, but supported by some backends.
   */
  deletePayment(paymentId: string): Observable<void> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}`);
    return this.http.delete<void>(url, { headers: this.authHeaders() });
  }
}
