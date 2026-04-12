import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { BookingDto } from '../../core/booking.dto';
import { AdminOffers } from '../admin-offers/admin-offers';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminOffers],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private readonly bookingService = inject(BookingService);

  bookings: BookingDto[] = [];
  filterStatus: 'all' | string = 'all';

  loading = false;
  loadError: string | null = null;

  ngOnInit(): void {
    this.reloadBookings();
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

  /** Safe CSS fragment for status-based card style */
  statusClass(status: string): string {
    const s = (status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return s || 'unknown';
  }
}
