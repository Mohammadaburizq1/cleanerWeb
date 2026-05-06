import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, firstValueFrom, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { PaymentsService } from '../../core/payments.service';
import { AuthService } from '../../core/auth.service';
import type { BookingDto } from '../../core/booking.dto';
import type { MeDto } from '../../core/auth.dto';
import {
  bookingLooksLikeSubscription,
  parseBookingNotesForDisplay,
  subscriptionCancellationIndicatedFromBooking,
  type ParsedBookingNotes,
} from './booking-notes.util';

/** One row for table/cards (booking + parsed notes + optional payment status). */
export interface OrderHistoryRow {
  booking: BookingDto;
  parsed: ParsedBookingNotes;
  paymentStatus: string | null;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss',
})
export class OrderHistoryComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly auth = inject(AuthService);

  loading = false;
  /** True after first load attempt finishes (success or error). */
  hasLoaded = false;
  errorMessage = '';
  /** Email used for the lookup (from your account). */
  accountEmail: string | null = null;
  rows: OrderHistoryRow[] = [];

  /** Signed-in user id — required to call cancel-subscription (matches booking.registeredUserId when set). */
  private currentUserId: string | null = null;

  /** Booking id being cancelled (subscription). */
  cancellingBookingId: string | null = null;

  cancelBanner: { type: 'ok' | 'err'; text: string } | null = null;

  /** Booking ids the user successfully cancelled (persisted — GET often still shows old status until webhook). */
  private cancelledSubscriptionBookingIds = new Set<string>();

  private readonly LS_CANCELLED_SUB_IDS = 'cleanhome-cancelled-sub-booking-ids';

  ngOnInit(): void {
    this.loadCancelledSubscriptionIdsFromStorage();
    this.loadMyOrders();
  }

  /** Normalize booking id — API may vary GUID casing vs localStorage. */
  private normBookingId(id: string): string {
    return id.trim().toLowerCase();
  }

  private loadCancelledSubscriptionIdsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.LS_CANCELLED_SUB_IDS);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        this.cancelledSubscriptionBookingIds = new Set(
          parsed
            .filter((x): x is string => typeof x === 'string' && x.length > 0)
            .map((x) => this.normBookingId(x)),
        );
      }
    } catch {
      this.cancelledSubscriptionBookingIds = new Set();
    }
  }

  private persistCancelledSubscriptionIds(): void {
    try {
      localStorage.setItem(this.LS_CANCELLED_SUB_IDS, JSON.stringify([...this.cancelledSubscriptionBookingIds]));
    } catch {
      // ignore quota / private mode
    }
  }

  /** Reload bookings for the signed-in account email. */
  refresh(): void {
    this.loadMyOrders();
  }

  private loadMyOrders(): void {
    this.loadCancelledSubscriptionIdsFromStorage();
    this.errorMessage = '';
    this.rows = [];
    this.loading = true;

    const cached = this.auth.me();
    const profile$ =
      cached?.email?.trim() ? of(cached) : this.auth.loadMe().pipe(catchError((err: unknown) => of(null as MeDto | null)));

    profile$
      .pipe(
        switchMap((me) => {
          this.currentUserId = me?.id?.trim() ? me.id.trim() : null;
          return this.ordersForProfile(me);
        }),
        finalize(() => {
          this.loading = false;
          this.hasLoaded = true;
        }),
      )
      .subscribe({
        next: (list) => {
          this.rows = list;
        },
      });
  }

  /** Loads bookings by account email; sets `accountEmail` or `errorMessage`. */
  private ordersForProfile(me: MeDto | null) {
    if (!me) {
      this.accountEmail = null;
      this.errorMessage = 'Could not load your account. Please sign in again.';
      return of<OrderHistoryRow[]>([]);
    }

    const email = me.email?.trim() ?? '';
    if (!email) {
      this.accountEmail = null;
      this.errorMessage =
        'Your account does not have an email address on file. Bookings are matched by the email used when you placed an order.';
      return of<OrderHistoryRow[]>([]);
    }

    this.accountEmail = email;

    return this.bookingService.listBookingsByEmail(email).pipe(
      switchMap((bookings) => this.enrichRows(bookings)),
      catchError((err: unknown) => {
        this.errorMessage = this.formatHttpError(err);
        return of<OrderHistoryRow[]>([]);
      }),
    );
  }

  display(value: string | null | undefined): string {
    const v = (value ?? '').trim();
    return v.length ? v : '—';
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  /** True when notes/API indicate recurring plan (Weekly / Biweekly / Monthly). */
  isSubscriptionBooking(row: OrderHistoryRow): boolean {
    return bookingLooksLikeSubscription(row.booking, row.parsed);
  }

  /**
   * Subscription row already cancelled (API notes/status or successful cancel in this browser).
   * Check persisted IDs first — after GET refresh, `discountPercent`/notes may not parse as subscription,
   * which previously hid "Canceled" even though we stored the booking id on successful POST cancel.
   */
  isSubscriptionCanceled(row: OrderHistoryRow): boolean {
    if (this.cancelledSubscriptionBookingIds.has(this.normBookingId(row.booking.id))) return true;
    if (!bookingLooksLikeSubscription(row.booking, row.parsed)) return false;
    return subscriptionCancellationIndicatedFromBooking(row.booking);
  }

  /** Show cancel only for subscription-like bookings owned by this account. */
  canCancelSubscription(row: OrderHistoryRow): boolean {
    if (this.isSubscriptionCanceled(row)) return false;
    if (!this.currentUserId || !bookingLooksLikeSubscription(row.booking, row.parsed)) return false;
    const rid = row.booking.registeredUserId?.trim();
    if (rid) return rid === this.currentUserId;
    const em = (row.booking.customerEmail ?? '').trim().toLowerCase();
    const ac = (this.accountEmail ?? '').trim().toLowerCase();
    return !!em && em === ac;
  }

  async cancelSubscription(row: OrderHistoryRow): Promise<void> {
    if (!this.canCancelSubscription(row) || !this.currentUserId) return;
    const ok = window.confirm(
      'Cancel this subscription? Billing typically stops at the end of the current period (depending on your Stripe settings). This cannot be undone from here.',
    );
    if (!ok) return;

    this.cancelBanner = null;
    this.cancellingBookingId = row.booking.id;
    try {
      const res = await firstValueFrom(
        this.paymentsService.cancelSubscription({
          customerId: this.currentUserId,
          bookingId: row.booking.id,
          cancelAtPeriodEnd: true,
        }),
      );
      this.cancelBanner = {
        type: 'ok',
        text: res.message?.trim() || 'Subscription cancellation requested.',
      };
      this.cancelledSubscriptionBookingIds.add(this.normBookingId(row.booking.id));
      this.persistCancelledSubscriptionIds();
      this.refresh();
    } catch (err: unknown) {
      this.cancelBanner = {
        type: 'err',
        text: this.formatCancelError(err),
      };
    } finally {
      this.cancellingBookingId = null;
    }
  }

  private formatCancelError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const raw = err.error;
      if (typeof raw === 'object' && raw !== null && 'message' in raw && typeof (raw as { message?: unknown }).message === 'string') {
        const m = (raw as { message: string }).message.trim();
        if (m) return m;
      }
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
      return err.status === 404
        ? 'Cancel subscription API not found. Deploy POST /api/stripe/cancel-subscription.'
        : `Could not cancel (${err.status}).`;
    }
    return 'Could not cancel subscription. Try again later.';
  }

  private enrichRows(bookings: BookingDto[]) {
    const sorted = [...bookings].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });

    return this.paymentsService.listPayments().pipe(
      map((payments) => {
        const byBooking = new Map<string, string>();
        const safe = Array.isArray(payments) ? payments : [];
        for (const p of safe) {
          const bid = p.bookingId?.trim();
          if (bid) byBooking.set(bid, p.status);
        }
        return sorted.map((b) => ({
          booking: b,
          parsed: parseBookingNotesForDisplay(b.notes),
          paymentStatus: byBooking.get(b.id) ?? null,
        }));
      }),
      catchError(() =>
        of(
          sorted.map((b) => ({
            booking: b,
            parsed: parseBookingNotesForDisplay(b.notes),
            paymentStatus: null as string | null,
          })),
        ),
      ),
    );
  }

  private formatHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Could not reach the server. If your site uses a custom domain, the API may need CORS configured for that origin.';
      }
      if (err.status === 404) {
        return 'Order lookup is not available (endpoint missing). Ensure GET /api/Booking/by-email is deployed on the API.';
      }
      const raw = err.error;
      const msg =
        typeof raw === 'object' && raw !== null && 'message' in raw && typeof (raw as { message?: unknown }).message === 'string'
          ? (raw as { message: string }).message
          : null;
      if (msg?.trim()) return msg.trim();
      return `Request failed (${err.status}). Please try again later.`;
    }
    return 'Something went wrong. Please try again.';
  }
}
