import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../core/feedback.service';
import type { CreateFeedbackDto } from '../../core/feedback.dto';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
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
    const { name, rating, comment } = this.feedbackForm.getRawValue();
    const dto: CreateFeedbackDto = {
      guestUserName: (name ?? '').trim() || null,
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
        this.feedbackForm.reset({ name: '', rating: 0, comment: '' });
      },
      error: () => {
        this.feedbackSubmitting = false;
        this.feedbackError = 'Could not submit feedback. Please try again.';
      },
    });
  }
}
