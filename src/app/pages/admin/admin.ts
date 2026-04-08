import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrdersService, Order, OrderStatus } from '../../core/orders.service';
import { API_BASE_URL } from '../../core/api-base-url';
import { AuthService } from '../../core/auth.service';
import { BookingService } from '../../core/booking.service';
import { FeedbackService } from '../../core/feedback.service';
import { PaymentsService } from '../../core/payments.service';
import { QuoteService } from '../../core/quote.service';
import { CleaningCatalogService } from '../../core/cleaning-catalog.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private ordersService = inject(OrdersService);
  readonly apiBase = inject(API_BASE_URL, { optional: true }) ?? '';

  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private feedbackService = inject(FeedbackService);
  private paymentsService = inject(PaymentsService);
  private quoteService = inject(QuoteService);
  private catalogService = inject(CleaningCatalogService);

  orders: Order[] = [];
  filterStatus: OrderStatus | 'all' = 'all';

  /** API playground */
  apiOutput = '';
  apiBusy = false;

  bookingIdInput = '';
  paymentIdInput = '';
  feedbackIdInput = '';
  quoteIdInput = '';
  stripeProviderIdInput = '';
  stripeConfirmPmInput = '';
  feedbackUserIdQuery = '';
  feedbackBookingIdQuery = '';
  stripeLimit = 20;

  readonly serviceTypeLabels: Record<string, string> = {
    residential: 'Residential Cleaning',
    deep: 'Deep Cleaning',
    'move-in-out': 'Move In / Move Out',
    office: 'Office Cleaning',
  };

  readonly propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartment',
    villa: 'Villa',
    office: 'Office',
    shop: 'Shop',
  };

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orders = this.ordersService.getOrders();
  }

  get filteredOrders(): Order[] {
    if (this.filterStatus === 'all') return this.orders;
    return this.orders.filter((o) => o.status === this.filterStatus);
  }

  accept(order: Order): void {
    this.ordersService.accept(order.id);
    this.loadOrders();
  }

  reject(order: Order): void {
    this.ordersService.reject(order.id);
    this.loadOrders();
  }

  refund(order: Order): void {
    this.ordersService.refund(order.id);
    this.loadOrders();
  }

  setFilter(status: OrderStatus | 'all'): void {
    this.filterStatus = status;
  }

  serviceLabel(value: string): string {
    return this.serviceTypeLabels[value] ?? value;
  }

  propertyLabel(value: string): string {
    return this.propertyTypeLabels[value] ?? value;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  openSwagger(): void {
    const root = (this.apiBase || 'http://localhost:5073').replace(/\/+$/, '');
    window.open(`${root}/swagger`, '_blank', 'noopener,noreferrer');
  }

  private async apiRun<T>(fn: () => Promise<T>): Promise<void> {
    this.apiBusy = true;
    this.apiOutput = '';
    try {
      const data = await fn();
      this.apiOutput = JSON.stringify(data, null, 2);
    } catch (err: unknown) {
      const e = err as { error?: unknown; message?: string };
      this.apiOutput =
        e?.error !== undefined ? JSON.stringify(e.error, null, 2) : String(e?.message ?? err);
    } finally {
      this.apiBusy = false;
    }
  }

  apiRefresh(): void {
    void this.apiRun(() => firstValueFrom(this.authService.refresh()));
  }

  apiMe(): void {
    void this.apiRun(() => firstValueFrom(this.authService.loadMe()));
  }

  apiGetServices(): void {
    void this.apiRun(() => firstValueFrom(this.catalogService.getServices()));
  }

  apiListBookings(): void {
    void this.apiRun(() => firstValueFrom(this.bookingService.listBookings()));
  }

  apiGetBooking(): void {
    const id = this.bookingIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a booking UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.bookingService.getBooking(id)));
  }

  apiListFeedback(): void {
    void this.apiRun(() =>
      firstValueFrom(
        this.feedbackService.getFeedback({
          userId: this.feedbackUserIdQuery.trim() || undefined,
          bookingId: this.feedbackBookingIdQuery.trim() || undefined,
        }),
      ),
    );
  }

  apiGetFeedback(): void {
    const id = this.feedbackIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a feedback UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.feedbackService.getFeedbackById(id)));
  }

  apiListPayments(): void {
    void this.apiRun(() => firstValueFrom(this.paymentsService.listPayments()));
  }

  apiListStripePayments(): void {
    void this.apiRun(() => firstValueFrom(this.paymentsService.listStripePayments(this.stripeLimit)));
  }

  apiGetPayment(): void {
    const id = this.paymentIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a payment UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.getPayment(id)));
  }

  apiAcceptPayment(): void {
    const id = this.paymentIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a payment UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.acceptPayment(id)));
  }

  apiRejectPayment(): void {
    const id = this.paymentIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a payment UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.rejectPayment(id)));
  }

  apiRefundPayment(): void {
    const id = this.paymentIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a payment UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.refundPayment(id)));
  }

  apiStripeAccept(): void {
    const id = this.stripeProviderIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter Stripe providerPaymentId (pi_...).';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.acceptStripeProviderPayment(id)));
  }

  apiStripeConfirm(): void {
    const pid = this.stripeProviderIdInput.trim();
    const pm = this.stripeConfirmPmInput.trim();
    if (!pid || !pm) {
      this.apiOutput = 'Enter providerPaymentId and paymentMethodToken (pm_...).';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.paymentsService.confirmStripePayment(pid, pm)));
  }

  apiListQuotes(): void {
    void this.apiRun(() => firstValueFrom(this.quoteService.listQuotes()));
  }

  apiGetQuote(): void {
    const id = this.quoteIdInput.trim();
    if (!id) {
      this.apiOutput = 'Enter a quote UUID.';
      return;
    }
    void this.apiRun(() => firstValueFrom(this.quoteService.getQuote(id)));
  }
}
