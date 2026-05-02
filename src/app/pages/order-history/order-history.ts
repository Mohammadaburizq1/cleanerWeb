import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { PaymentsService } from '../../core/payments.service';
import { AuthService } from '../../core/auth.service';
import type { BookingDto } from '../../core/booking.dto';
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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss',
})
export class OrderHistory {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitted = false;
  loading = false;
  hasSearched = false;
  errorMessage = '';
  rows: OrderHistoryRow[] = [];

  search(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.rows = [];

    if (this.form.invalid) {
      return;
    }

    const email = this.form.controls.email.value.trim();
    this.loading = true;
    this.hasSearched = true;

    this.bookingService
      .listBookingsByEmail(email)
      .pipe(
        switchMap((bookings) => this.enrichRows(bookings)),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (list) => {
          this.rows = list;
        },
        error: (err: unknown) => {
          this.errorMessage = this.formatHttpError(err);
        },
      });
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

    if (!this.auth.isLoggedIn()) {
      return of(
        sorted.map((b) => ({
          booking: b,
          parsed: parseBookingNotesForDisplay(b.notes),
          paymentStatus: null as string | null,
        })),
      );
    }

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
