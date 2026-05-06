import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { FormBusyOverlay } from '../../shared/components/form-busy-overlay/form-busy-overlay';

function passwordMatchValidator(group: AbstractControl): { passwordMismatch: true } | null {
  const g = group as FormGroup;
  const pass = g.get('newPassword')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormBusyOverlay],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  /** Raw token from `?token=` (backend expects min length 20). */
  resetToken = '';

  form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  submitted = false;
  loading = false;
  errorMessage = '';

  get newPassword() {
    return this.form.get('newPassword')!;
  }

  get confirmPassword() {
    return this.form.get('confirmPassword')!;
  }

  get tokenLooksValid(): boolean {
    return this.resetToken.length >= 20;
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.resetToken = this.readResetTokenFromParams(params);
    });
  }

  /** Supports `token`, `resetToken`, or `code`; URL-decodes safely (email clients may encode). */
  private readResetTokenFromParams(params: ParamMap): string {
    const keys = ['token', 'resetToken', 'code'];
    for (const key of keys) {
      const raw = params.get(key)?.trim();
      if (!raw) continue;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.tokenLooksValid) {
      this.errorMessage = 'This reset link is missing or invalid. Request a new link below.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const newPassword = this.newPassword.value ?? '';

    this.auth
      .resetPassword({
        token: this.resetToken,
        newPassword,
      })
      .subscribe({
        next: (result) => {
          if (!result.success) {
            this.loading = false;
            this.errorMessage = result.errors?.filter(Boolean).join(', ') || 'Could not reset password.';
            return;
          }
          this.auth.loadMe().subscribe({
            next: () => {
              this.loading = false;
              void this.router.navigateByUrl('/');
            },
            error: () => {
              this.loading = false;
              void this.router.navigateByUrl('/login');
            },
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          this.errorMessage = this.formatResetError(err);
        },
      });
  }

  private formatResetError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'string' && body.trim()) return body.trim();
      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        const errors = o['errors'];
        if (Array.isArray(errors) && errors.every((e) => typeof e === 'string')) {
          const joined = (errors as string[]).filter(Boolean).join(', ');
          if (joined) return joined;
        }
        if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
          const flat = Object.values(errors as Record<string, unknown>).flat();
          const parts = flat.filter((e): e is string => typeof e === 'string');
          if (parts.length) return parts.join(', ');
        }
        const msg =
          (typeof o['message'] === 'string' && o['message'].trim()) ||
          (typeof o['Message'] === 'string' && (o['Message'] as string).trim()) ||
          (typeof o['detail'] === 'string' && o['detail'].trim()) ||
          (typeof o['title'] === 'string' && o['title'].trim());
        if (msg) return msg;
      }
      if (err.status === 0) {
        return 'Could not reach the server. Check your connection and API configuration.';
      }
      if (err.status === 400 || err.status === 401 || err.status === 404) {
        return 'Invalid or expired reset link. Please request a new one from Forgot password.';
      }
    }
    return 'Invalid or expired reset link. Please request a new one.';
  }
}
