import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../core/feedback.service';
import { CreateFeedbackDto } from '../../core/feedback.dto';

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

  submit() {
    if (this.contactForm.invalid) return;
    console.log(this.contactForm.value);
    // later connect to API: this.contactService.sendMessage(...)
  }

  setRating(value: number) {
    this.feedbackForm.patchValue({ rating: value });
  }

  submitFeedback() {
    if (this.feedbackForm.invalid) return;
    const { rating, comment } = this.feedbackForm.value;

    const payload: CreateFeedbackDto = {
      bookingId: null,
      rating: rating ?? 0,
      comment: comment ?? null,
    };

    this.feedbackService.createFeedback(payload).subscribe({
      next: () => {
        this.feedbackForm.reset({ name: '', rating: 0, comment: '' });
      },
      error: (error) => {
        console.error('Error submitting feedback', error);
      },
    });
  }
}
