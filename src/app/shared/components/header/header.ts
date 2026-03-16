import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SelectedTasksService } from '../../../core/selected-tasks.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isLightTheme = false;

  private selectedTasksService = inject(SelectedTasksService);

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('site-theme');

    this.isLightTheme = savedTheme === 'light';
    this.applyTheme();
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
    this.selectedTasksService.goToBookNow();
  }
}