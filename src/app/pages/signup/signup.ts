import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
    // Replace with real API call (e.g. register endpoint)
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/login']);
    }, 800);
  }
}
