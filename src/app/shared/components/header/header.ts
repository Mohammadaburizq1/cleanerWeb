import { Component, OnInit, inject, computed, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
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

  private selectedTasksService = inject(SelectedTasksService);
  private auth = inject(AuthService);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly me = this.auth.me;
  readonly isAdmin = computed(() => {
    const user = this.me();
    return !!user && user.role?.toLowerCase() === 'admin';
  });

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('site-theme');

    this.isLightTheme = savedTheme === 'light';
    this.applyTheme();

    if (this.isLoggedIn()) {
      this.auth.loadMe().subscribe();
    }
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