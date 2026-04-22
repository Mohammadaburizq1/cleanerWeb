import { Component, OnInit, inject, computed, HostListener, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SelectedTasksService } from '../../../core/selected-tasks.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isLightTheme = false;
  mobileMenuOpen = false;
  private meLoadAttempted = false;

  private selectedTasksService = inject(SelectedTasksService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly me = this.auth.me;
  readonly isAdmin = computed(() => {
    const roleRaw = (this.me()?.role ?? this.auth.getRoleFromAccessToken() ?? '').toString();
    const role = roleRaw.toLowerCase().trim();
    return (
      !!role &&
      (role === 'admin' || role === 'administrator' || role === 'superadmin')
    );
  });

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('site-theme');

    this.isLightTheme = savedTheme === 'light';
    this.applyTheme();

    // Header can be mounted before login occurs; reactively load the profile once after login.
    effect(() => {
      if (this.isLoggedIn() && !this.meLoadAttempted) {
        this.meLoadAttempted = true;
        this.auth.loadMe().subscribe({ error: () => void 0 });
      }
      if (!this.isLoggedIn()) {
        this.meLoadAttempted = false;
      }
    });
  }

  toggleTheme(): void {
    this.isLightTheme = !this.isLightTheme;
    this.applyTheme();

    localStorage.setItem('site-theme', this.isLightTheme ? 'light' : 'dark');
  }

  private applyTheme(): void {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(this.isLightTheme ? 'theme-light' : 'theme-dark');
  }

  goToBookNow(): void {
    this.closeMobileMenu();
    this.selectedTasksService.goToBookNow();
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseMenu(): void {
    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}