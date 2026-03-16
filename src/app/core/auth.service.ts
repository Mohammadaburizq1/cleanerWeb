import { Injectable, signal } from '@angular/core';

const ADMIN_KEY = 'is-admin-logged-in';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Simple admin flag for demo purposes. Replace with real auth / JWT later. */
  private readonly _isAdminLoggedIn = signal<boolean>(this.loadInitial());

  readonly isAdminLoggedIn = this._isAdminLoggedIn.asReadonly();

  private loadInitial(): boolean {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  }

  loginAsAdmin(): void {
    this._isAdminLoggedIn.set(true);
    localStorage.setItem(ADMIN_KEY, 'true');
  }

  logoutAdmin(): void {
    this._isAdminLoggedIn.set(false);
    localStorage.removeItem(ADMIN_KEY);
  }
}

