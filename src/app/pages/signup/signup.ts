import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, first, map, of, switchMap, timer } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { RegisterDto } from '../../core/auth.dto';
import { FormBusyOverlay } from '../../shared/components/form-busy-overlay/form-busy-overlay';

function passwordMatchValidator(group: AbstractControl): { passwordMismatch: true } | null {
  const g = group as FormGroup;
  const pass = g.get('password')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass !== confirm ? { passwordMismatch: true } : null;
}

/** Calls GET /api/Auth/email-available — marks email taken before submit when backend supports it. */
function emailAvailabilityValidator(auth: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return of(null);
    if (Validators.email(control)) return of(null);

    return timer(450).pipe(
      switchMap(() => auth.checkEmailAvailability(raw)),
      map((status) => (status === 'taken' ? { emailTaken: true } : null)),
      catchError(() => of(null)),
      first(),
    );
  };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormBusyOverlay],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  signupForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [emailAvailabilityValidator(this.auth)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  submitted = false;
  loading = false;
  errorMessage = '';

  showPassword = false;
  showConfirmPassword = false;

  get fullName() {
    return this.signupForm.get('fullName');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;

    const payload: RegisterDto = {
      fullName: this.fullName?.value ?? '',
      email: this.email?.value ?? '',
      password: this.password?.value ?? '',
    };

    this.auth.register(payload).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = result.errors?.join(', ') || 'Sign up failed.';
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse && err.status === 0) {
          this.errorMessage =
            'The browser could not complete the request (status 0). This is often a CORS issue: the API must allow your site’s origin, or the server may be unreachable. Check the Network tab and your backend CORS settings.';
        } else if (err instanceof HttpErrorResponse) {
          this.errorMessage = this.parseSignupApiError(err);
          const msg = this.errorMessage.toLowerCase();
          if (
            /already|exist|registered|duplicate|taken|in use/i.test(msg) ||
            err.status === 409
          ) {
            this.email?.setErrors({ ...(this.email.errors ?? {}), emailTaken: true });
            this.email?.markAsTouched();
          }
        } else {
          this.errorMessage = 'Unable to sign up. Please try again.';
        }
      },
    });
  }

  private parseSignupApiError(err: HttpErrorResponse): string {
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
      if (errs && typeof errs === 'object') return JSON.stringify(errs);
    }
    if (err.status === 400) return 'Could not create account. Check your details or use a different email.';
    return 'Unable to sign up. Please try again.';
  }
}
