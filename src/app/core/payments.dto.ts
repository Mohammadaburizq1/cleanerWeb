/** POST /api/Payments — OpenAPI CreatePaymentRequest (flat body). */
export interface CreatePaymentRequest {
  provider: string;
  currency: string;
  amount?: number | string;
  bookingId?: string | null;
  paymentMethodToken?: string | null;
}

export interface CreatePaymentResponse {
  paymentId: string;
  providerPaymentId: string | null;
  clientSecret: string | null;
  status: string;
  createdAt: string;
}

export interface PaymentDto {
  paymentId: string;
  providerPaymentId: string | null;
  bookingId: string | null;
  provider: string;
  currency: string;
  amount: number | string;
  status: string;
  createdAt: string;
}

/** POST /api/Payments/stripe/{providerPaymentId}/confirm */
export interface ConfirmStripePaymentRequest {
  paymentMethodToken: string;
}
