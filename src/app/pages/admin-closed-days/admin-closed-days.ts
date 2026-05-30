import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClosedDaysService } from '../../core/closed-days.service';
import type { ClosedDayDto } from '../../core/closed-days.dto';
import { DialogService } from '../../shared/components/dialog/dialog.service';

@Component({
  selector: 'app-admin-closed-days',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-closed-days.html',
  styleUrl: './admin-closed-days.scss',
})
export class AdminClosedDays {
  private readonly closedDaysService = inject(ClosedDaysService);
  private readonly dialog = inject(DialogService);

  /** When true, compact header for use inside main `/admin` page. */
  @Input() embedded = false;

  closedDays: ClosedDayDto[] = [];
  busy = false;
  loadError: string | null = null;
  formError: string | null = null;

  /** `YYYY-MM-DD` for the date picker. */
  newDate = '';
  newReason = '';

  constructor() {
    this.loadClosedDays();
  }

  loadClosedDays(): void {
    void this.reloadClosedDaysFromServer(true);
  }

  /** Refetch closed days from the API so the list matches server state after CRUD. */
  private reloadClosedDaysFromServer(showBusy: boolean): Promise<void> {
    if (showBusy) this.busy = true;
    this.loadError = null;
    return firstValueFrom(this.closedDaysService.listAllClosedDays())
      .then((rows) => {
        this.closedDays = rows;
      })
      .catch((err: unknown) => {
        this.loadError = this.errMessage(err);
      })
      .finally(() => {
        if (showBusy) this.busy = false;
      });
  }

  /** Minimum selectable date (today, local). */
  minDate(): string {
    const d = new Date();
    return this.dateToYmd(d);
  }

  async addClosedDay(): Promise<void> {
    const date = (this.newDate ?? '').trim();
    if (!date) {
      this.formError = 'Pick a date to close.';
      return;
    }
    if (date < this.minDate()) {
      this.formError = 'Cannot close a past date.';
      return;
    }
    if (this.closedDays.some((d) => d.date === date)) {
      this.formError = 'That date is already closed.';
      return;
    }

    this.formError = null;
    this.busy = true;
    try {
      const reason = this.newReason.trim() === '' ? null : this.newReason.trim();
      await firstValueFrom(this.closedDaysService.createClosedDay({ date, reason }));
      this.newDate = '';
      this.newReason = '';
      await this.reloadClosedDaysFromServer(false);
      this.busy = false;
    } catch (err: unknown) {
      this.formError = this.errMessage(err);
      this.busy = false;
    }
  }

  async reopenDay(day: ClosedDayDto): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Reopen day',
      message: `Allow bookings again on ${this.formatDisplayDate(day.date)}?`,
      confirmText: 'Reopen',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    this.busy = true;
    this.formError = null;
    try {
      await firstValueFrom(this.closedDaysService.deleteClosedDay(day.id));
      await this.reloadClosedDaysFromServer(false);
      this.busy = false;
    } catch (err: unknown) {
      this.formError = this.errMessage(err);
      this.busy = false;
    }
  }

  formatDisplayDate(ymd: string): string {
    const d = new Date(`${ymd}T12:00:00`);
    if (isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  isPast(ymd: string): boolean {
    return ymd < this.minDate();
  }

  private dateToYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private errMessage(err: unknown): string {
    const e = err as { error?: { message?: string; title?: string }; message?: string; status?: number };
    const msg =
      (typeof e?.error === 'object' && e.error && 'message' in e.error && e.error.message) ||
      (typeof e?.error === 'object' && e.error && 'title' in e.error && e.error.title) ||
      e?.message;
    if (e?.status === 401) return 'Unauthorized — sign in as an admin and try again.';
    return typeof msg === 'string' && msg ? msg : 'Request failed. Check API base URL and CORS.';
  }
}
