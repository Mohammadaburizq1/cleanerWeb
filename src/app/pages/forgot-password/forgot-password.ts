import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitted = false;
  loading = false;
  /** Shown after any successful HTTP response (API does not reveal if email exists). */
  requestAcknowledged = false;
  errorMessage = '';

  get email() {
    return this.form.controls.email;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const email = this.email.value.trim();

    this.auth.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.requestAcknowledged = true;
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse) {
          if (err.status === 0) {
            this.errorMessage =
              'Could not reach the server. Check your connection and API configuration (including CORS).';
            return;
          }
          const raw = err.error;
          const msg =
            typeof raw === 'object' &&
            raw !== null &&
            'message' in raw &&
            typeof (raw as { message?: unknown }).message === 'string'
              ? (raw as { message: string }).message
              : null;
          if (msg?.trim()) {
            this.errorMessage = msg.trim();
            return;
          }
        }
        this.errorMessage = 'Something went wrong. Please try again.';
      },
    });
  }
}
