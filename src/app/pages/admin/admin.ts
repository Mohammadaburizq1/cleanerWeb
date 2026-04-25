import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { BookingDto } from '../../core/booking.dto';
import { AdminOffers } from '../admin-offers/admin-offers';
import { PaymentsService } from '../../core/payments.service';
import type { PaymentDto } from '../../core/payments.dto';

/** HTTP payment statuses that should not show Refund (no capture yet or final negative state). */
const NON_REFUNDABLE = new Set(
  [
    'refunded',
    'rejected',
    'failed',
    'canceled',
    'cancelled',
    'pending',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'open',
    'draft',
  ].map((s) => s.toLowerCase()),
);

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminOffers],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly paymentsService = inject(PaymentsService);

  bookings: BookingDto[] = [];
  filterStatus: 'all' | string = 'all';

  payments: PaymentDto[] = [];
  paymentsLoading = false;
  paymentsError: string | null = null;
  refundingPaymentId: string | null = null;

  loading = false;
  loadError: string | null = null;

  ngOnInit(): void {
    this.reloadAll();
  }

  reloadAll(): void {
    this.reloadBookings();
    this.reloadPayments();
  }

  reloadBookings(): void {
    this.loading = true;
    this.loadError = null;
    this.bookingService
      .listBookings()
      .pipe(
        catchError(() => {
          this.loadError = 'Could not load bookings. Sign in if required, and check API / CORS.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe((rows) => {
        this.bookings = rows;
      });
  }

  reloadPayments(): void {
    this.paymentsLoading = true;
    this.paymentsError = null;
    this.paymentsService
      .listPayments()
      .pipe(
        catchError(() => {
          this.paymentsError =
            'Could not load payments. Sign in as admin if required, and check API / CORS.';
          return of([] as PaymentDto[]);
        }),
        finalize(() => {
          this.paymentsLoading = false;
        }),
      )
      .subscribe((rows) => {
        this.payments = rows;
      });
  }

  canRefundPayment(p: PaymentDto): boolean {
    return !NON_REFUNDABLE.has((p.status || '').toLowerCase());
  }

  onBookingRefundClick(bookingId: string): void {
    const p = this.paymentForBooking(bookingId);
    if (p) {
      this.requestRefund(p);
    }
  }

  /** Class fields (not prototype methods) so HMR / dev client always has callable handlers on the instance. */
  readonly bookingRefundIsRefunding = (bookingId: string): boolean => {
    const p = this.paymentForBooking(bookingId);
    return p ? this.refundingPaymentId === p.paymentId : false;
  };

  readonly bookingRefundIsDisabled = (bookingId: string): boolean => {
    if (this.paymentsLoading) {
      return true;
    }
    if (this.refundingPaymentId) {
      return true;
    }
    const p = this.paymentForBooking(bookingId);
    if (!p) {
      return true;
    }
    return !this.canRefundPayment(p);
  };

  readonly bookingRefundTitle = (bookingId: string): string => {
    if (this.paymentsLoading) {
      return 'Loading payments…';
    }
    if (this.paymentsError) {
      return 'Payments list failed to load. Tap Refresh, or refund from the Payments section below.';
    }
    const p = this.paymentForBooking(bookingId);
    if (!p) {
      return 'No API payment is linked. The payment must include bookingId matching this booking, or use Refund on that charge in the Payments section below.';
    }
    if (!this.canRefundPayment(p)) {
      return 'Not available for this payment status.';
    }
    return 'Issue a refund for this charge';
  };

  requestRefund(p: PaymentDto): void {
    if (!this.canRefundPayment(p) || this.refundingPaymentId) return;
    const amt = p.amount;
    const cur = p.currency || '';
    const line = p.bookingId
      ? `Issue refund for this payment (${String(amt)} ${cur})? Booking: ${p.bookingId}.`
      : `Issue refund for this payment (${String(amt)} ${cur})?`;
    if (!globalThis.confirm(line)) return;

    this.refundingPaymentId = p.paymentId;
    this.paymentsError = null;
    this.paymentsService
      .refundPayment(p.paymentId)
      .pipe(
        catchError((err) => {
          this.paymentsError = err?.error?.message
            ? String(err.error.message)
            : 'Refund could not be processed. Check the payment state and try again.';
          return of(null);
        }),
        finalize(() => {
          this.refundingPaymentId = null;
        }),
      )
      .subscribe((res) => {
        if (res) {
          const i = this.payments.findIndex((x) => x.paymentId === res.paymentId);
          if (i >= 0) this.payments = [...this.payments.slice(0, i), res, ...this.payments.slice(i + 1)];
        }
      });
  }

  get statusOptions(): string[] {
    const set = new Set(this.bookings.map((b) => b.status).filter(Boolean));
    return Array.from(set).sort();
  }

  get filteredBookings(): BookingDto[] {
    if (this.filterStatus === 'all') return this.bookings;
    return this.bookings.filter((b) => b.status === this.filterStatus);
  }

  setFilter(status: 'all' | string): void {
    this.filterStatus = status;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  formatAmount(p: PaymentDto): string {
    const n = typeof p.amount === 'number' ? p.amount : Number(p.amount);
    if (Number.isFinite(n)) {
      return `${n.toFixed(2)} ${p.currency}`.trim();
    }
    return `${String(p.amount)} ${p.currency}`.trim();
  }

  /**
   * Payment record linked to this booking (`PaymentDto.bookingId` === booking id from API).
   * Prefer the most recent payment that is still refundable; otherwise the most recent for this booking.
   */
  paymentForBooking(bookingId: string): PaymentDto | null {
    if (!this.payments.length) return null;
    const want = bookingId.trim().toLowerCase();
    const matches = this.payments.filter(
      (p) => p.bookingId && p.bookingId.trim().toLowerCase() === want,
    );
    if (matches.length === 0) return null;
    const byDate = (a: PaymentDto, b: PaymentDto) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const refundable = matches.filter((p) => this.canRefundPayment(p));
    if (refundable.length) {
      return [...refundable].sort(byDate)[0];
    }
    return [...matches].sort(byDate)[0];
  }

  /** Safe CSS fragment for status-based card style */
  statusClass(status: string): string {
    const s = (status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return s || 'unknown';
  }
}
