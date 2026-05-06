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

/** POST /api/stripe/create-subscription-checkout — OpenAPI CreateSubscriptionCheckoutDto */
export type SubscriptionPlanType = 'ONE_WEEK' | 'TWO_WEEKS' | 'FOUR_WEEKS';

export interface CreateSubscriptionCheckoutDto {
  customerId: string;
  bookingId: string;
  planType: SubscriptionPlanType;
}

/** Response from POST /api/stripe/create-subscription-checkout */
export interface CreateSubscriptionCheckoutResponseDto {
  checkoutUrl: string;
}
