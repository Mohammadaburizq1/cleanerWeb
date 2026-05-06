import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-busy-overlay',
  standalone: true,
  templateUrl: './form-busy-overlay.html',
  styleUrl: './form-busy-overlay.scss',
})
export class FormBusyOverlay {
  /** When true, shows full-screen busy overlay with spinner. */
  readonly busy = input.required<boolean>();
  readonly title = input<string>('Please wait…');
  readonly hint = input<string | undefined>(undefined);
}
