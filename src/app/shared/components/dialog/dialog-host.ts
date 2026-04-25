import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-host.html',
  styleUrl: './dialog-host.scss',
})
export class DialogHost {
  private readonly dialog = inject(DialogService);
  readonly state = this.dialog.state;

  onBackdropClick(): void {
    const s = this.state();
    if (!s.open || s.busy) return;
    this.dialog.closeWithCancel();
  }

  onCancel(): void {
    const s = this.state();
    if (!s.open || s.busy) return;
    this.dialog.closeWithCancel();
  }

  onConfirm(): void {
    const s = this.state();
    if (!s.open || s.busy) return;
    this.dialog.closeWithConfirm();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }
}

