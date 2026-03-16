import { Component, inject } from '@angular/core';
import { SelectedTasksService } from '../../../../core/selected-tasks.service';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [],
  templateUrl: './cta.html',
  styleUrl: './cta.scss',
})
export class Cta {
  private selectedTasksService = inject(SelectedTasksService);

  goToBookNow(): void {
    this.selectedTasksService.goToBookNow();
  }
}
