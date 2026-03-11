import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
})
export class BookingForm {
  private fb = inject(FormBuilder);

  bookingForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    service: ['', Validators.required],
    address: ['', Validators.required],
    date: ['', Validators.required],
    message: [''],
  });

  submitted = false;

  submit(): void {
    this.submitted = true;

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    console.log('Booking request:', this.bookingForm.getRawValue());
  }

  get f() {
    return this.bookingForm.controls;
  }
}
