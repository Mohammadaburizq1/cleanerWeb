import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LoginDto } from '../../core/auth.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitted = false;
  loading = false;
  errorMessage = '';

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const payload: LoginDto = {
      email: this.email?.value ?? '',
      password: this.password?.value ?? '',
    };

    this.auth.login(payload).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.auth.loadMe().subscribe();  
          console.log(this.auth.me());
          this.router.navigate(['/']);
        } else {
          this.errorMessage = result.errors?.join(', ') || 'Login failed.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to login. Please try again.';
      },
    });
  }
}
