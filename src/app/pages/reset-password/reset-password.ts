import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

function passwordMatchValidator(group: AbstractControl): { passwordMismatch: true } | null {
  const g = group as FormGroup;
  const pass = g.get('newPassword')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
    this.resetToken = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
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
      if (body && typeof body === 'object') {
        const errors = (body as { errors?: unknown }).errors;
        if (Array.isArray(errors) && errors.every((e) => typeof e === 'string')) {
          const joined = (errors as string[]).filter(Boolean).join(', ');
          if (joined) return joined;
        }
        const msg = (body as { message?: string }).message;
        if (typeof msg === 'string' && msg.trim()) return msg.trim();
      }
      if (err.status === 0) {
        return 'Could not reach the server. Check your connection and API configuration.';
      }
    }
    return 'Invalid or expired reset link. Please request a new one.';
  }
}
