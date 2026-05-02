import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { PaymentsService } from '../../core/payments.service';
import { AuthService } from '../../core/auth.service';
import type { BookingDto } from '../../core/booking.dto';
import type { MeDto } from '../../core/auth.dto';
import { parseBookingNotesForDisplay, type ParsedBookingNotes } from './booking-notes.util';

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

  ngOnInit(): void {
    this.loadMyOrders();
  }

  /** Reload bookings for the signed-in account email. */
  refresh(): void {
    this.loadMyOrders();
  }

  private loadMyOrders(): void {
    this.errorMessage = '';
    this.rows = [];
    this.loading = true;

    const cached = this.auth.me();
    const profile$ =
      cached?.email?.trim() ? of(cached) : this.auth.loadMe().pipe(catchError((err: unknown) => of(null as MeDto | null)));

    profile$
      .pipe(
        switchMap((me) => this.ordersForProfile(me)),
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

  private enrichRows(bookings: BookingDto[]) {
    const sorted = [...bookings].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });

    return this.paymentsService.listPayments().pipe(
      map((payments) => {
        const byBooking = new Map<string, string>();
        for (const p of payments) {
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
