import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RegisterDto } from '../../core/auth.dto';

function passwordMatchValidator(group: AbstractControl): { passwordMismatch: true } | null {
  const g = group as FormGroup;
  const pass = g.get('password')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
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
        } else {
          this.errorMessage = 'Unable to sign up. Please try again.';
        }
      },
    });
  }
}
