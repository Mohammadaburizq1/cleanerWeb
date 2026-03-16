import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SelectedTasksService } from '../../../../core/selected-tasks.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private selectedTasksService = inject(SelectedTasksService);

  goToBookNow(): void {
    this.selectedTasksService.goToBookNow();
  }
}
