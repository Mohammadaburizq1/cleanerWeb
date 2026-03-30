import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, joinUrl } from './api-base-url';
import { CreatePaymentRequest, CreatePaymentResponse, PaymentDto } from './payments.dto';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '';

  /** POST /api/Payments - create a payment (e.g. charge / intent) */
  createPayment(dto: CreatePaymentRequest): Observable<CreatePaymentResponse> {
    const url = joinUrl(this.apiBaseUrl, '/api/Payments');
    return this.http.post<CreatePaymentResponse>(url, dto);
  }

  /** POST /api/Payments/stripe/{providerPaymentId}/confirm - confirm stripe payment with payment method id */
  confirmStripePayment(providerPaymentId: string, paymentMethodToken: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/stripe/${providerPaymentId}/confirm`);
    return this.http.post<PaymentDto>(url, { paymentMethodToken });
  }

  /** GET /api/Payments/{paymentId} - load a single payment details */
  getPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}`);
    return this.http.get<PaymentDto>(url);
  }

  /** POST /api/Payments/{paymentId}/accept - mark payment as accepted */
  acceptPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/accept`);
    return this.http.post<PaymentDto>(url, {});
  }

  /** POST /api/Payments/{paymentId}/reject - mark payment as rejected (and cancel Stripe intent if any) */
  rejectPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/reject`);
    return this.http.post<PaymentDto>(url, {});
  }

  /** POST /api/Payments/{paymentId}/refund - refund payment (and create Stripe refund if any) */
  refundPayment(paymentId: string): Observable<PaymentDto> {
    const url = joinUrl(this.apiBaseUrl, `/api/Payments/${paymentId}/refund`);
    return this.http.post<PaymentDto>(url, {});
  }
  
}

