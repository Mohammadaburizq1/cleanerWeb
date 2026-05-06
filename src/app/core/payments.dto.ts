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
  /** Optional `pm_...` if card was collected with Elements before Checkout (omit when card is only entered on Stripe). */
  paymentMethodToken?: string | null;
  /**
   * Optional recurring charge hint for Stripe/backend; if omitted or ≤ 0, server uses booking/default pricing.
   */
  recurringAmount?: number | null;
  /**
   * Booking / account email — backend should set Stripe Checkout Session `customer_email` so Checkout
   * pre-fills contact info (user may still see the field; Stripe uses it for receipts).
   */
  customerEmail?: string | null;
}

/** Response from POST /api/stripe/create-subscription-checkout */
export interface CreateSubscriptionCheckoutResponseDto {
  checkoutUrl: string;
}

/** POST /api/stripe/cancel-subscription — OpenAPI CancelSubscriptionDto */
export interface CancelSubscriptionDto {
  customerId: string;
  bookingId: string;
  /** When true, Stripe typically cancels at period end (default true for safer UX). */
  cancelAtPeriodEnd?: boolean;
}

/** POST /api/stripe/cancel-subscription response */
export interface CancelSubscriptionResponseDto {
  cancelAtPeriodEnd: boolean;
  message: string;
}
