import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from '../../core/orders.service';
import { PaymentsService } from '../../core/payments.service';
import { SelectedTasksService } from '../../core/selected-tasks.service';
import { loadStripe, type Stripe, type StripeCardElement, type StripeElements } from '@stripe/stripe-js';

type ServiceOption = {
  value: string;
  label: string;
};

/** Tasks selected on the Services checklist and passed via router state */
export type SelectedTask = { sectionTitle: string; task: string };

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private selectedTasksService = inject(SelectedTasksService);
  private ordersService = inject(OrdersService);
  private paymentsService = inject(PaymentsService);

  // NOTE: ضع publishable key هنا (يبدأ بـ pk_...). غير آمن وضع secret key في الواجهة.
  private readonly stripePublishableKey = 'pk_test_51T9yxTKF6Nx8oRAGg7hqMLzOpBZFZkvuYJD9F7aRPsu7X3UZbnPizpM5boNfejUC3benVJxfz5o2d0EsuAIgT83q00J7uKkPiB';

  @ViewChild('stripeCardMount', { static: false })
  private stripeCardMount?: ElementRef<HTMLDivElement>;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  cardElementError: string | null = null;
  stripeReady = false;
  cardComplete = false;

  /** Tasks chosen on the Services page (from "Book Now" with checkboxes) */
  selectedTasks: SelectedTask[] = [];
  /** Number of rooms from Services page */
  numberOfRooms: number | null = null;
  /** Number of bedrooms from Services page */
  numberOfBedrooms: number | null = null;
  /** Number of bathrooms from Services page */
  numberOfBathrooms: number | null = null;
  /** Number of cleaners (hourly service) */
  numberOfCleaners: number | null = null;
  /** Duration in hours (hourly service) */
  hourlyDurationHours: number | null = null;
  /** Estimated cost from Services page (from selected sections + rooms or hourly) */
  estimatedCost: number | null = null;
  currency = 'JD';
  /** Currency code for backend/payment (ISO 3 letters). */
  private readonly paymentCurrency = 'usd';
  /** Cost breakdown / receipt lines (from Services page) */
  selectedSectionsWithPrices: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[] = [];

  /** Sales tax rate (e.g. 0.06 = 6%). Set to 0 if no tax. */
  readonly salesTaxRate = 0.06;

  serviceOptions: ServiceOption[] = [
    { value: 'residential', label: 'Residential Cleaning' },
    { value: 'deep', label: 'Deep Cleaning' },
    { value: 'move-in-out', label: 'Move In / Move Out Cleaning' },
    { value: 'office', label: 'Office Cleaning' },
  ];

  bookingForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.email]],
    serviceType: ['', Validators.required],
    propertyType: ['', Validators.required],
    address: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    cardHolder: ['', [Validators.required, Validators.minLength(2)]],
    notes: [''],
  });

  submitted = false;
  sending = false;
  errorMessage = '';

  showBookingFeedbackDialog = false;
  bookingFeedbackPercent: number | null = null;
  bookingFeedbackSubmitted = false;
  bookingFeedbackCardInfo: { holder: string; maskedNumber: string; expiry: string } | null = null;

  /** Snapshot of selected services shown inside the feedback dialog */
  bookingFeedbackSelectedSectionsWithPrices: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[] =
    [];

  ngOnInit(): void {
    const state = history.state as {
      selectedTasks?: SelectedTask[];
      numberOfRooms?: number | null;
      numberOfBedrooms?: number | null;
      numberOfBathrooms?: number | null;
      numberOfCleaners?: number | null;
      hourlyDurationHours?: number | null;
      estimatedCost?: number | null;
      currency?: string;
      selectedSectionsWithPrices?: { title: string; taskCount?: number; pricePerTask?: number; amount: number }[];
    } | undefined;
    this.selectedTasks = state?.selectedTasks ?? [];
    this.numberOfRooms = state?.numberOfRooms ?? null;
    this.numberOfBedrooms = state?.numberOfBedrooms ?? null;
    this.numberOfBathrooms = state?.numberOfBathrooms ?? null;
    this.numberOfCleaners = state?.numberOfCleaners ?? null;
    this.hourlyDurationHours = state?.hourlyDurationHours ?? null;
    this.estimatedCost = state?.estimatedCost ?? null;
    this.currency = state?.currency ?? 'JD';
    this.selectedSectionsWithPrices = state?.selectedSectionsWithPrices ?? [];
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.stripePublishableKey) return;
    if (!this.stripeCardMount) return;

    const stripe = await loadStripe(this.stripePublishableKey);
    if (!stripe) {
      this.cardElementError = 'Stripe failed to load. Check your publishable key.';
      return;
    }

    this.stripe = stripe;
    this.elements = stripe.elements();

    const card = this.elements.create('card', {
      hidePostalCode: true,
    });

    card.mount(this.stripeCardMount.nativeElement);

    card.on('change', (event) => {
      this.cardElementError = event.error?.message ?? null;
      this.cardComplete = event.complete;
    });

    this.cardElement = card;
    this.stripeReady = true;
  }

  ngOnDestroy(): void {
    try {
      this.cardElement?.unmount();
    } catch {
      // ignore
    }
  }

  private async createPaymentMethod(): Promise<{
    paymentMethodId: string;
    last4: string;
    expiryMMYY: string;
  }> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe is not ready yet.');
    }

    const cardHolder = (this.bookingForm.get('cardHolder')?.value ?? '').trim();

    const result = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
      billing_details: {
        name: cardHolder,
      },
    });

    if (result.error) {
      throw new Error(result.error.message ?? 'Failed to create payment method.');
    }

    const paymentMethodId = result.paymentMethod?.id;
    const last4 = result.paymentMethod?.card?.last4;
    const expMonth = result.paymentMethod?.card?.exp_month;
    const expYear = result.paymentMethod?.card?.exp_year;

    if (!paymentMethodId || !last4 || !expMonth || !expYear) {
      throw new Error('Stripe did not return card details.');
    }

    const expiryMMYY = `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;

    return { paymentMethodId, last4, expiryMMYY };
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.showBookingFeedbackDialog = false;
    this.bookingFeedbackPercent = null;
    this.bookingFeedbackSubmitted = false;
    this.bookingFeedbackSelectedSectionsWithPrices = [];
    this.bookingFeedbackCardInfo = null;

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    // لا نحاول إنشاء paymentMethod إذا بيانات البطاقة غير مكتملة.
    if (!this.cardComplete) {
      this.errorMessage = this.cardElementError ?? 'الرجاء إكمال بيانات البطاقة (خصوصًا Expiry).';
      return;
    }

    this.sending = true;

    try {
      const payload = this.bookingForm.getRawValue() as {
        fullName: string;
        phone: string;
        email: string;
        serviceType: string;
        propertyType: string;
        address: string;
        preferredDate: string;
        preferredTime: string;
        cardHolder: string;
        notes: string;
      };

      const sectionsSnapshot = this.selectedSectionsWithPrices.map((s) => ({ ...s }));

      // Create order first, then confirm payment and mark order as accepted.
      const order = this.ordersService.addOrder({
        fullName: payload.fullName ?? '',
        phone: payload.phone ?? '',
        email: payload.email ?? '',
        serviceType: payload.serviceType ?? '',
        propertyType: payload.propertyType ?? '',
        address: payload.address ?? '',
        preferredDate: payload.preferredDate ?? '',
        preferredTime: payload.preferredTime ?? '',
        notes: payload.notes ?? '',
        estimatedCost: this.estimatedCost ?? null,
        currency: this.currency,
        propertyLabel: this.propertyLabel,
      });

      // 1) Create pm_... on frontend using Stripe Elements
      const pm = await this.createPaymentMethod();

      const bookingIdGuid = this.generateBookingGuid();

      // 2) Create a Stripe payment intent on backend (backend requires `request` wrapper)
      const createPaymentBody = {
        provider: 'stripe',
        currency: this.paymentCurrency,
        amount: this.total,
        paymentMethodToken: pm.paymentMethodId,
        request: {
          provider: 'stripe',
          currency: this.paymentCurrency,
          amount: this.total,
          paymentMethodToken: pm.paymentMethodId,
        },
        bookingId: bookingIdGuid,
      };
      console.log('[PaymentsService.createPayment] body:', createPaymentBody);

      const createPaymentResp = await firstValueFrom(
        this.paymentsService.createPayment(createPaymentBody),
      );

      const providerPaymentId = createPaymentResp.providerPaymentId;
      if (!providerPaymentId) throw new Error('Backend did not return providerPaymentId for Stripe.');

      // 3) Confirm payment on backend using pm_...
      console.log('[PaymentsService.confirmStripePayment] providerPaymentId:', providerPaymentId);
      console.log('[PaymentsService.confirmStripePayment] paymentMethodId:', pm.paymentMethodId);
      await firstValueFrom(this.paymentsService.confirmStripePayment(providerPaymentId, pm.paymentMethodId));

      this.ordersService.accept(order.id);

      // Clear UI state after successful payment
      this.bookingForm.reset();
      this.submitted = false;
      this.selectedTasksService.clearAll();
      this.selectedTasks = [];
      this.numberOfRooms = null;
      this.numberOfBedrooms = null;
      this.numberOfBathrooms = null;
      this.estimatedCost = null;
      this.selectedSectionsWithPrices = [];

      this.bookingFeedbackSelectedSectionsWithPrices = sectionsSnapshot;
      this.bookingFeedbackCardInfo = {
        holder: (payload.cardHolder ?? '').trim(),
        maskedNumber: `**** **** **** ${pm.last4}`,
        expiry: pm.expiryMMYY,
      };

      this.showBookingFeedbackDialog = true;
      this.bookingFeedbackPercent = 100;
      this.bookingFeedbackSubmitted = false;
    } catch (err) {
      // HttpErrorResponse from Angular includes backend validation details in `error`
      // so show them to user for faster debugging.
      const anyErr = err as any;
      console.log('[Booking.submit] error raw:', anyErr);
      if (anyErr?.error?.errors) {
        this.errorMessage = `Payment failed: ${JSON.stringify(anyErr.error.errors)}`;
      } else if (anyErr?.error) {
        this.errorMessage = `Payment failed: ${JSON.stringify(anyErr.error)}`;
      } else {
        this.errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      }
    } finally {
      this.sending = false;
    }
  }

  get f() {
    return this.bookingForm.controls;
  }

  /** Sub-total from selected services (before tax) */
  get subTotal(): number {
    return this.estimatedCost ?? 0;
  }

  /** Sales tax amount */
  get salesTax(): number {
    return Math.round(this.subTotal * this.salesTaxRate * 100) / 100;
  }

  /** Total (sub-total + tax) */
  get total(): number {
    return Math.round((this.subTotal + this.salesTax) * 100) / 100;
  }

  /** Label for property/rooms (e.g. "2 Bedrooms, 1 Bathroom") */
  get propertyLabel(): string {
    const beds = this.numberOfBedrooms ?? 0;
    if (beds <= 0) {
      const cleaners = this.numberOfCleaners ?? 1;
      const hours = this.hourlyDurationHours ?? 0;
      if (hours <= 0) return 'Hourly Service';
      return `Hourly Service · ${cleaners} Cleaner${cleaners === 1 ? '' : 's'} · ${hours} Hours`;
    }
    const baths = this.numberOfBathrooms ?? 0;
    const parts: string[] = [];
    if (beds > 0) parts.push(`${beds} Bedroom${beds === 1 ? '' : 's'}`);
    if (baths > 0) parts.push(`${baths} Bathroom${baths === 1 ? '' : 's'}`);
    return parts.join(', ') || 'Choose property...';
  }

  setBookingFeedbackPercent(value: number): void {
    this.bookingFeedbackPercent = Math.max(0, Math.min(100, value));
  }

  confirmBookingFeedback(): void {
    this.bookingFeedbackSubmitted = true;
  }

  closeBookingFeedbackDialog(): void {
    this.showBookingFeedbackDialog = false;
  }

  private generateBookingGuid(): string {
    // Generates a GUID to satisfy backend validation (backend expects Guid).
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for older browsers: not cryptographically strong but good enough for UI demo.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  get bookingFeedbackHeadline(): string {
    const p = this.bookingFeedbackPercent ?? 100;
    return p >= 50 ? `${p}% Happy` : `${100 - p}% Sad`;
  }

  get bookingFeedbackEmoji(): string {
    const p = this.bookingFeedbackPercent ?? 100;
    if (p >= 90) return '😄';
    if (p >= 70) return '🙂';
    if (p >= 50) return '😊';
    if (p >= 30) return '😐';
    if (p >= 10) return '🙁';
    return '😢';
  }

  /** Service date for summary (formatted or placeholder) */
  get serviceDateLabel(): string {
    const d = this.bookingForm.get('preferredDate')?.value;
    if (!d) return 'Choose service date...';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'Choose service date...';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
