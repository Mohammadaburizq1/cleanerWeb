import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OfferService } from '../../core/offer.service';
import { CreateOfferDto, OfferDto, UpdateOfferDto } from '../../core/offer.dto';
import { DialogService } from '../../shared/components/dialog/dialog.service';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-offers.html',
  styleUrl: './admin-offers.scss',
})
export class AdminOffers {
  private readonly offerService = inject(OfferService);
  private readonly dialog = inject(DialogService);

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
    void this.reloadOffersFromServer(true);
  }

  /** Refetch offers from the API so the list matches server state after CRUD. */
  private reloadOffersFromServer(showBusy: boolean): Promise<void> {
    if (showBusy) this.busy = true;
    this.loadError = null;
    return firstValueFrom(this.offerService.listAllOffers())
      .then((rows) => {
        this.offers = rows;
      })
      .catch((err: unknown) => {
        this.loadError = this.errMessage(err);
      })
      .finally(() => {
        if (showBusy) this.busy = false;
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
      if (this.editingId) {
        await firstValueFrom(this.offerService.updateOffer(this.editingId, dto as UpdateOfferDto));
      } else {
        await firstValueFrom(this.offerService.createOffer(dto));
      }
      this.emptyForm();
      await this.reloadOffersFromServer(false);
      this.busy = false;
    } catch (err: unknown) {
      this.formError = this.errMessage(err);
      this.busy = false;
    }
  }

  async remove(o: OfferDto): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Delete offer',
      message: `Delete offer “${o.title}”? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    this.busy = true;
    this.formError = null;
    try {
      await firstValueFrom(this.offerService.deleteOffer(o.id));
      if (this.editingId === o.id) this.emptyForm();
      await this.reloadOffersFromServer(false);
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
