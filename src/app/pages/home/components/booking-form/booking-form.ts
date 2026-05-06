import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QuoteService } from '../../../../core/quote.service';
import type { CreateQuoteRequestDto } from '../../../../core/quote.dto';
import { FormBusyOverlay } from '../../../../shared/components/form-busy-overlay/form-busy-overlay';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormBusyOverlay],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
})
export class BookingForm {
  private fb = inject(FormBuilder);
  private quoteService = inject(QuoteService);

  bookingForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    service: ['', Validators.required],
    address: ['', Validators.required],
    date: ['', Validators.required],
    message: [''],
  });

  submitted = false;
  submitting = false;
  submitError: string | null = null;
  submitSuccess = false;

  submit(): void {
    this.submitted = true;
    this.submitError = null;
    this.submitSuccess = false;

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const v = this.bookingForm.getRawValue();
    const dateStr = v.date ?? '';
    const preferredDateIso = new Date(`${dateStr}T12:00:00`).toISOString();

    const dto: CreateQuoteRequestDto = {
      fullName: (v.name ?? '').trim(),
      phone: (v.phone ?? '').trim(),
      serviceType: v.service ?? '',
      preferredDate: preferredDateIso,
      address: (v.address ?? '').trim(),
      additionalDetails: (v.message ?? '').trim() || null,
    };

    this.submitting = true;
    this.quoteService.submitQuote(dto).subscribe({
      next: () => {
        this.submitting = false;
        this.submitSuccess = true;
        this.submitted = false;
        this.bookingForm.reset({
          name: '',
          phone: '',
          service: '',
          address: '',
          date: '',
          message: '',
        });
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Could not send your quote. Please try again or call us.';
      },
    });
  }

  get f() {
    return this.bookingForm.controls;
  }
}
