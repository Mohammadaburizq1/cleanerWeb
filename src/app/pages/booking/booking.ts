import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersService } from '../../core/orders.service';
import { SelectedTasksService } from '../../core/selected-tasks.service';

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
export class Booking implements OnInit {
  private fb = inject(FormBuilder);
  private selectedTasksService = inject(SelectedTasksService);
  private ordersService = inject(OrdersService);

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
    notes: [''],
  });

  submitted = false;
  sending = false;
  successMessage = '';
  errorMessage = '';

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

  submit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.sending = true;

    const payload = this.bookingForm.getRawValue() as {
      fullName: string;
      phone: string;
      email: string;
      serviceType: string;
      propertyType: string;
      address: string;
      preferredDate: string;
      preferredTime: string;
      notes: string;
    };
    console.log('Booking payload:', payload);

    // Replace this with real API call; for now we store in OrdersService for admin
    setTimeout(() => {
      this.ordersService.addOrder({
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
      this.sending = false;
      this.successMessage = 'Your booking request has been submitted successfully.';
      this.bookingForm.reset();
      this.submitted = false;
      this.selectedTasksService.clearAll();
      this.selectedTasks = [];
      this.numberOfRooms = null;
      this.numberOfBedrooms = null;
      this.numberOfBathrooms = null;
      this.estimatedCost = null;
      this.selectedSectionsWithPrices = [];
    }, 800);
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

  /** Service date for summary (formatted or placeholder) */
  get serviceDateLabel(): string {
    const d = this.bookingForm.get('preferredDate')?.value;
    if (!d) return 'Choose service date...';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'Choose service date...';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
