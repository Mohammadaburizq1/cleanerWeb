import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { DialogHost } from './shared/components/dialog/dialog-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, DialogHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('cleaning-site');
  protected readonly router = inject(Router);
}
