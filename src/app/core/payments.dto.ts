export interface CreatePaymentRequest {
  /**
   * backend متطلب (Required): جسم إنشاء الدفع داخل حقل اسمه `request`.
   * */
  request: {
    provider: string;
    currency: string;
    amount?: number | string;
    paymentMethodToken?: string | null;
  };

  /**
   * backend متطلب: bookingId كـ Guid (في حال عدم وجوده نرسل null).
   */
  bookingId?: string | null;

  /**
   * ملاحظة: حسب Validation Errors في الـ backend،
   * يبدو أنه يتوقع أيضًا provider/currency على مستوى الجذر.
   * لذلك نرسلها أيضًا لتوافق الـ model.
   */
  provider?: string;
  currency?: string;
  amount?: number | string;
  paymentMethodToken?: string | null;
}

export interface CreatePaymentResponse {
  paymentId: string;
  providerPaymentId: string | null;
  clientSecret: string | null;
  status: string;
  createdAt: string; // ISO date-time
}

export interface PaymentDto {
  paymentId: string;
  providerPaymentId: string | null;
  bookingId: string | null;
  provider: string;
  currency: string;
  amount: number | string;
  status: string;
  createdAt: string; // ISO date-time
}

