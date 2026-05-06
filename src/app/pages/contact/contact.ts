import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackService } from '../../core/feedback.service';
import type { CreateFeedbackDto } from '../../core/feedback.dto';
import { BUSINESS_CONTACT } from '../../core/contact.constants';
import { FormBusyOverlay } from '../../shared/components/form-busy-overlay/form-busy-overlay';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule, FormBusyOverlay],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly contact = BUSINESS_CONTACT;
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);

  contactForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    service: ['', Validators.required],
    message: [''],
  });

  feedbackForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  feedbackSubmitting = false;
  feedbackError: string | null = null;
  feedbackSuccess = false;

  submit() {
    if (this.contactForm.invalid) return;
    // Contact inquiry: add a backend route if you expose one; feedback below uses POST /api/Feedback.
  }

  setRating(value: number): void {
    this.feedbackForm.patchValue({ rating: value });
  }

  submitFeedback(): void {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }
    this.feedbackError = null;
    this.feedbackSuccess = false;
    const { name, email, rating, comment } = this.feedbackForm.getRawValue();
    const dto: CreateFeedbackDto = {
      guestUserName: (name ?? '').trim() || null,
      guestEmail: (email ?? '').trim() || null,
      bookingId: null,
      userId: null,
      rating: rating ?? 1,
      comment: (comment ?? '').trim() || null,
    };
    this.feedbackSubmitting = true;
    this.feedbackService.createFeedback(dto).subscribe({
      next: () => {
        this.feedbackSubmitting = false;
        this.feedbackSuccess = true;
        this.feedbackForm.reset({ name: '', email: '', rating: 0, comment: '' });
      },
      error: (err: unknown) => {
        this.feedbackSubmitting = false;
        if (err instanceof HttpErrorResponse) {
          const m = err.error?.['message'] ?? err.error?.['title'] ?? err.message;
          this.feedbackError =
            typeof m === 'string' && m.trim()
              ? m
              : `Could not submit feedback (${err.status}). Check API URL, CORS, and network.`;
        } else {
          this.feedbackError = 'Could not submit feedback. Please try again.';
        }
      },
    });
  }
}
