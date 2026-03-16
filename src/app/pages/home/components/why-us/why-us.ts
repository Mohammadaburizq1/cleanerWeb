import { Component, inject } from '@angular/core';
import { SelectedTasksService } from '../../../../core/selected-tasks.service';

@Component({
  selector: 'app-why-us',
  standalone: true,
  imports: [],
  templateUrl: './why-us.html',
  styleUrl: './why-us.scss',
})
export class WhyUs {
  private selectedTasksService = inject(SelectedTasksService);

  goToBookNow(): void {
    this.selectedTasksService.goToBookNow();
  }
}
