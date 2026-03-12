import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type ServiceOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking {
  private fb = inject(FormBuilder);

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
    bedrooms: [''],
    bathrooms: [''],
    address: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    notes: [''],
  });

  submitted = false;
  sending = false;
  successMessage = '';
  errorMessage = '';

  submit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.sending = true;

    const payload = this.bookingForm.getRawValue();
    console.log('Booking payload:', payload);

    // Replace this with real API call
    setTimeout(() => {
      this.sending = false;
      this.successMessage = 'Your booking request has been submitted successfully.';
      this.bookingForm.reset();
      this.submitted = false;
    }, 800);
  }

  get f() {
    return this.bookingForm.controls;
  }
}
