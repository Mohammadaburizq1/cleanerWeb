import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { FormBusyOverlay } from '../../shared/components/form-busy-overlay/form-busy-overlay';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormBusyOverlay],
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
  /** Shown after successful POST /api/Auth/forgot-password. */
  requestAcknowledged = false;
  /** Optional message from API `ForgotPasswordResponseDto.message`. */
  successMessage = '';
  errorMessage = '';

  get email() {
    return this.form.controls.email;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const email = this.email.value.trim();

    this.auth.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.requestAcknowledged = true;
        this.successMessage = (res.message ?? '').trim();
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse && err.status === 0) {
          this.errorMessage =
            'Could not reach the server. Check your connection and API configuration (including CORS).';
          return;
        }
        if (err instanceof HttpErrorResponse) {
          this.errorMessage = this.parseForgotPasswordApiError(err);
          return;
        }
        this.errorMessage = 'Something went wrong. Please try again.';
      },
    });
  }

  private parseForgotPasswordApiError(err: HttpErrorResponse): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      const msg =
        (typeof o['message'] === 'string' && o['message'].trim()) ||
        (typeof o['detail'] === 'string' && o['detail'].trim()) ||
        (typeof o['title'] === 'string' && o['title'].trim()) ||
        (typeof o['error'] === 'string' && o['error'].trim());
      if (msg) return msg;
      const errs = o['errors'];
      if (typeof errs === 'string') return errs;
      if (Array.isArray(errs)) return errs.filter((e): e is string => typeof e === 'string').join(', ');
      if (errs && typeof errs === 'object') return JSON.stringify(errs);
    }
    if (err.status === 400) return 'Could not process this request. Check the email address and try again.';
    return 'Something went wrong. Please try again.';
  }
}
