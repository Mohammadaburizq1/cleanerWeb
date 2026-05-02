import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private route = inject(ActivatedRoute);
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
        if (!result.success) {
          this.loading = false;
          this.errorMessage = result.errors?.join(', ') || 'Login failed.';
          return;
        }
        this.auth.loadMe().subscribe({
          next: () => {
            this.loading = false;
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            const target =
              returnUrl &&
              returnUrl.startsWith('/') &&
              !returnUrl.startsWith('//') &&
              !returnUrl.includes(':')
                ? returnUrl
                : '/';
            void this.router.navigateByUrl(target);
          },
          error: () => {
            this.loading = false;
            this.errorMessage = 'Could not load your profile. Please try again.';
          },
        });
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to login. Please try again.';
      },
    });
  }
}
