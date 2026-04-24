import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OfferService } from '../../core/offer.service';
import { CreateOfferDto, OfferDto, UpdateOfferDto } from '../../core/offer.dto';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-offers.html',
  styleUrl: './admin-offers.scss',
})
export class AdminOffers {
  private readonly offerService = inject(OfferService);

  /** When true, compact header for use inside main `/admin` page. */
  @Input() embedded = false;

  offers: OfferDto[] = [];
  busy = false;
  loadError: string | null = null;

  editingId: string | null = null;

  title = '';
  summary = '';
  detail = '';
  badge = '';
  /** Percentage discount (e.g. 15); empty = none */
  discountPercent: number | null = null;
  sortOrder = 0;
  isActive = true;

  formError: string | null = null;

  constructor() {
    this.loadOffers();
  }

  private emptyForm(): void {
    this.editingId = null;
    this.title = '';
    this.summary = '';
    this.detail = '';
    this.badge = '';
    this.discountPercent = null;
    this.sortOrder = 0;
    this.isActive = true;
    this.formError = null;
  }

  loadOffers(): void {
    this.busy = true;
    this.loadError = null;
    this.offerService.listAllOffers().subscribe({
      next: (rows) => {
        this.offers = rows;
        this.busy = false;
      },
      error: (err: unknown) => {
        this.busy = false;
        this.loadError = this.errMessage(err);
      },
    });
  }

  startEdit(o: OfferDto): void {
    this.editingId = o.id;
    this.title = o.title;
    this.summary = o.summary;
    this.detail = o.detail;
    this.badge = o.badge ?? '';
    this.discountPercent = o.discountPercent;
    this.sortOrder = o.sortOrder;
    this.isActive = o.isActive;
    this.formError = null;
  }

  cancelEdit(): void {
    this.emptyForm();
  }

  private normalizeDiscountPercent(v: number | null | undefined): number | null {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.min(100, n);
  }

  private buildDto(): CreateOfferDto {
    return {
      title: this.title.trim(),
      summary: this.summary.trim(),
      detail: this.detail.trim(),
      badge: this.badge.trim() === '' ? null : this.badge.trim(),
      discountPercent: this.normalizeDiscountPercent(this.discountPercent),
      sortOrder: Number.isFinite(this.sortOrder) ? this.sortOrder : 0,
      isActive: this.isActive,
    };
  }

  async save(): Promise<void> {
    const dto = this.buildDto();
    if (!dto.title || !dto.summary || !dto.detail) {
      this.formError = 'Title, summary, and detail are required.';
      return;
    }
    this.formError = null;
    this.busy = true;
    try {
      let saved: OfferDto | null = null;
      if (this.editingId) {
        saved = await firstValueFrom(this.offerService.updateOffer(this.editingId, dto as UpdateOfferDto));
      } else {
        saved = await firstValueFrom(this.offerService.createOffer(dto));
      }

      // Update the list immediately (no manual refresh needed).
      if (saved && saved.id) {
        const idx = this.offers.findIndex((o) => o.id === saved!.id);
        if (idx >= 0) {
          this.offers = [
            ...this.offers.slice(0, idx),
            saved,
            ...this.offers.slice(idx + 1),
          ];
        } else {
          this.offers = [...this.offers, saved];
        }
        this.offers = [...this.offers].sort((a, b) => a.sortOrder - b.sortOrder);
      }

      this.emptyForm();
      this.busy = false;
    } catch (err: unknown) {
      this.formError = this.errMessage(err);
      this.busy = false;
    }
  }

  async remove(o: OfferDto): Promise<void> {
    if (!confirm(`Delete offer “${o.title}”? This cannot be undone.`)) return;
    this.busy = true;
    this.formError = null;
    try {
      await firstValueFrom(this.offerService.deleteOffer(o.id));
      if (this.editingId === o.id) this.emptyForm();
      this.offers = this.offers.filter((x) => x.id !== o.id);
      this.busy = false;
    } catch (err: unknown) {
      this.formError = this.errMessage(err);
      this.busy = false;
    }
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
