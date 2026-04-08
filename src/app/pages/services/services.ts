import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CLEANING_CHECKLIST_SECTIONS,
  type ChecklistSection,
} from '../../core/cleaning-checklist.data';
import {
  computeServicesQuote,
  HOME_SQ_FT_TIERS,
  homeSqFtTierById,
  QUOTE_HOURLY_RATE_PER_CLEANER,
  QUOTE_PET_SURCHARGE_JD,
  QUOTE_PRICE_PER_BATHROOM,
  QUOTE_PRICE_PER_BEDROOM,
} from '../../core/services-quote';
import type { ReceiptLine } from '../../core/selected-tasks.service';
import { type SelectedTask, SelectedTasksService } from '../../core/selected-tasks.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services implements OnInit {
  readonly sectionTag = 'Get a quote';
  readonly mainHeading = 'Get A Quote and Complete Your Booking';
  readonly intro =
    'We’re transparent about what we do. Standard cleaning tasks live on the Checklist page in the menu; here you can get a quote and add optional upgrades.';

    readonly bedroomOptions: { label: string; value: number }[] = [
    { label: 'One Bedroom Home', value: 1 },
    { label: 'Two Bedroom Home', value: 2 },
    { label: 'Three Bedroom Home', value: 3 },
    { label: 'Four Bedroom Home', value: 4 },
    { label: 'Five Bedroom Home', value: 5 },
    { label: 'Six Bedroom Home', value: 6 },
    { label: 'Hourly Service', value: 0 },
  ];

  readonly bathroomOptions: { label: string; value: number }[] = [
    { label: '0 Bathrooms', value: 0 },
    { label: '1 Bathroom', value: 1 },
    { label: '2 Bathrooms', value: 2 },
    { label: '3 Bathrooms', value: 3 },
    { label: '4+ Bathrooms', value: 4 },
  ];

  /** Shown when "Hourly Service" is selected */
  readonly cleanerOptions: { label: string; value: number }[] = [
    { label: '1 Cleaner', value: 1 },
    { label: '2 Cleaners', value: 2 },
    { label: '3 Cleaners', value: 3 },
  ];

  readonly hourOptions: { label: string; value: number }[] = [
    { label: '2 Hours', value: 2 },
    { label: '2.5 Hours', value: 2.5 },
    { label: '3 Hours', value: 3 },
    { label: '3.5 Hours', value: 3.5 },
    { label: '4 Hours', value: 4 },
    { label: '4.5 Hours', value: 4.5 },
    { label: '5 Hours', value: 5 },
    { label: '5.5 Hours', value: 5.5 },
    { label: '6 Hours', value: 6 },
    { label: '6.5 Hours', value: 6.5 },
    { label: '7 Hours', value: 7 },
    { label: '7.5 Hours', value: 7.5 },
    { label: '8 Hours', value: 8 },
  ];

  readonly checklist: ChecklistSection[] = CLEANING_CHECKLIST_SECTIONS;
  /** Add-on services (Deep Clean, Moving Clean, Upgrades) */
  readonly addOnSections = this.checklist.slice(3);

  /** Which section titles are expanded (multiple can be open); all open by default */
  expanded = new Set<string>(this.checklist.map((s) => s.title));

  /** Checked items: key = "sectionTitle|task" */
  checkedItems = new Set<string>();

  /** Number of rooms (persisted in service) */
  numberOfRooms: number | null = null;
  /** Number of bedrooms (persisted in service) */
  numberOfBedrooms: number | null = null;
  /** Number of bathrooms (persisted in service) */
  numberOfBathrooms: number | null = null;
  /** Number of cleaners (for hourly service; persisted) */
  numberOfCleaners: number | null = null;
  /** Duration in hours (for hourly service; persisted) */
  hourlyDurationHours: number | null = null;
  /** Pets in the household (persisted) */
  hasPets = false;
  /** Home size tier id from Step 1 dropdown (persisted) */
  homeSqFtTierId: string | null = null;

  readonly homeSqFtTierOptions = HOME_SQ_FT_TIERS;
  readonly petSurchargeJd = QUOTE_PET_SURCHARGE_JD;

  /** Base quote: per bedroom and per bathroom (Step 1 drives the total). */
  readonly pricePerBedroom = QUOTE_PRICE_PER_BEDROOM;
  readonly pricePerBathroom = QUOTE_PRICE_PER_BATHROOM;
  /** Hourly rate per cleaner (used when Hourly Service is selected) */
  readonly hourlyRatePerCleaner = QUOTE_HOURLY_RATE_PER_CLEANER;
  readonly currency = 'JD';

  /** Sales tax rate (e.g. 0.06 = 6%). Set to 0 if no tax. */
  readonly salesTaxRate = 0.06;

  private router = inject(Router);
  private selectedTasksService = inject(SelectedTasksService);

  ngOnInit(): void {
    const saved = this.selectedTasksService.getSelectedTasks();
    this.checkedItems = new Set(saved.map((t) => `${t.sectionTitle}|${t.task}`));
    this.numberOfRooms = this.selectedTasksService.getNumberOfRooms();
    this.numberOfBedrooms = this.selectedTasksService.getNumberOfBedrooms();
    this.numberOfBathrooms = this.selectedTasksService.getNumberOfBathrooms();
    // Default quote step like reference: One Bedroom Home, 0 Bathrooms
    if (this.numberOfBedrooms == null) {
      this.numberOfBedrooms = 1;
      this.selectedTasksService.setNumberOfBedrooms(1);
    }
    if (this.numberOfBathrooms == null) {
      this.numberOfBathrooms = 0;
      this.selectedTasksService.setNumberOfBathrooms(0);
    }
    this.numberOfCleaners = this.selectedTasksService.getNumberOfCleaners();
    this.hourlyDurationHours = this.selectedTasksService.getHourlyDurationHours();
    if (this.numberOfCleaners == null) {
      this.numberOfCleaners = 1;
      this.selectedTasksService.setNumberOfCleaners(1);
    }
    if (this.hourlyDurationHours == null) {
      this.hourlyDurationHours = 7.5;
      this.selectedTasksService.setHourlyDurationHours(7.5);
    }
    this.hasPets = this.selectedTasksService.getHasPets();
    this.homeSqFtTierId = this.selectedTasksService.getHomeSqFtTierId();
    this.syncCostToService();
  }

  /** True when user selected "Hourly Service" (bedrooms = 0) */
  get isHourlyService(): boolean {
    return (this.numberOfBedrooms ?? 0) === 0;
  }

  private syncCostToService(): void {
    const { estimatedCost, selectedSectionsWithPrices } = this.computeQuote();
    this.selectedTasksService.setCostDetails({
      estimatedCost,
      selectedSectionsWithPrices,
    });
  }

  private computeQuote() {
    return computeServicesQuote({
      numberOfBedrooms: this.numberOfBedrooms,
      numberOfBathrooms: this.numberOfBathrooms,
      numberOfCleaners: this.numberOfCleaners,
      hourlyDurationHours: this.hourlyDurationHours,
      checkedItemKeys: this.checkedItems,
      hasPets: this.hasPets,
      homeSqFtTierId: this.homeSqFtTierId,
    });
  }

  onRoomsChange(): void {
    this.selectedTasksService.setNumberOfRooms(this.numberOfRooms);
  }

  updateRooms(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = el.value;
    this.numberOfRooms = v === '' ? null : Math.max(0, parseInt(v, 10) || 0);
    this.onRoomsChange();
    this.syncCostToService();
  }

  onBedroomChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const v = el.value;
    this.numberOfBedrooms = v === '' ? null : Math.max(0, parseInt(v, 10));
    this.selectedTasksService.setNumberOfBedrooms(this.numberOfBedrooms);
    this.syncCostToService();
  }

  onBathroomChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const v = el.value;
    this.numberOfBathrooms = v === '' ? null : Math.max(0, parseInt(v, 10));
    this.selectedTasksService.setNumberOfBathrooms(this.numberOfBathrooms);
    this.syncCostToService();
  }

  /** Clear task checkboxes and restore default Step 1 options */
  resetQuote(): void {
    this.checkedItems = new Set();
    this.selectedTasksService.clearAll();
    this.numberOfRooms = null;
    this.numberOfBedrooms = 1;
    this.numberOfBathrooms = 0;
    this.numberOfCleaners = 1;
    this.hourlyDurationHours = 7.5;
    this.selectedTasksService.setNumberOfBedrooms(1);
    this.selectedTasksService.setNumberOfBathrooms(0);
    this.selectedTasksService.setNumberOfCleaners(1);
    this.selectedTasksService.setHourlyDurationHours(7.5);
    this.hasPets = false;
    this.homeSqFtTierId = null;
    this.expanded = new Set(this.checklist.map((s) => s.title));
    this.syncCostToService();
  }

  onCleanersChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const v = el.value;
    this.numberOfCleaners = v === '' ? null : Math.max(1, parseInt(v, 10));
    this.selectedTasksService.setNumberOfCleaners(this.numberOfCleaners);
    this.syncCostToService();
  }

  onHoursChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const v = el.value;
    this.hourlyDurationHours = v === '' ? null : Math.max(0, parseFloat(v));
    this.selectedTasksService.setHourlyDurationHours(this.hourlyDurationHours);
    this.syncCostToService();
  }

  onHomeSqFtTierChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const v = el.value.trim();
    this.homeSqFtTierId = v === '' ? null : v;
    this.selectedTasksService.setHomeSqFtTierId(this.homeSqFtTierId);
    this.syncCostToService();
  }

  onHasPetsChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.hasPets = el.checked;
    this.selectedTasksService.setHasPets(this.hasPets);
    this.syncCostToService();
  }

  /** Number of checked items in a section */
  checkedCountInSection(section: ChecklistSection): number {
    return section.items.filter((item) => this.checkedItems.has(this.itemKey(section, item))).length;
  }

  /** Whether at least one item in this section is checked */
  hasSectionAnyChecked(section: ChecklistSection): boolean {
    return this.checkedCountInSection(section) > 0;
  }

  /** Home size line item for standard (non-hourly) quotes — bedrooms + bathrooms from Step 1 */
  get homeBaseTotal(): number {
    if (this.isHourlyService) return 0;
    const beds = Math.max(0, this.numberOfBedrooms ?? 0);
    const baths = Math.max(0, this.numberOfBathrooms ?? 0);
    return beds * this.pricePerBedroom + baths * this.pricePerBathroom;
  }

  /** Hourly subtotal before home-size / pet surcharges */
  get hourlyBaseSubtotal(): number {
    if (!this.isHourlyService) return 0;
    const cleaners = this.numberOfCleaners ?? 1;
    const hours = this.hourlyDurationHours ?? 0;
    return this.hourlyRatePerCleaner * cleaners * hours;
  }

  /** Estimated cost (includes home size tier + pets when selected). */
  get estimatedCost(): number {
    return this.computeQuote().estimatedCost;
  }

  /** Receipt lines for breakdown and booking (tasks + home size + pets). */
  get receiptLines(): ReceiptLine[] {
    return this.computeQuote().selectedSectionsWithPrices;
  }

  /** Sub-total (same as estimatedCost before tax) */
  get subTotal(): number {
    return this.estimatedCost;
  }

  /** Sales tax amount */
  get salesTax(): number {
    return Math.round(this.subTotal * this.salesTaxRate * 100) / 100;
  }

  /** Total (sub-total + tax) */
  get total(): number {
    return Math.round((this.subTotal + this.salesTax) * 100) / 100;
  }

  /** Property label for summary (e.g. "Two Bedroom Home · 2 Bathrooms" or "Hourly Service · 1 Cleaner · 7.5 Hours") */
  get propertyLabel(): string {
    const beds = this.numberOfBedrooms ?? 0;
    let base: string;
    if (beds <= 0) {
      const cleaners = this.numberOfCleaners ?? 1;
      const hours = this.hourlyDurationHours ?? 0;
      const cleanerLabel = this.cleanerOptions.find((o) => o.value === cleaners)?.label ?? `${cleaners} Cleaner${cleaners === 1 ? '' : 's'}`;
      const hourLabel = this.hourOptions.find((o) => o.value === hours)?.label ?? `${hours} Hours`;
      base = `Hourly Service · ${cleanerLabel} · ${hourLabel}`;
    } else {
      const baths = this.numberOfBathrooms ?? 0;
      const bedLabel = this.bedroomOptions.find((o) => o.value === beds)?.label ?? `${beds} Bedroom${beds === 1 ? '' : 's'}`;
      const bathLabel =
        baths <= 0
          ? '0 Bathrooms'
          : this.bathroomOptions.find((o) => o.value === baths)?.label ?? `${baths} Bathroom${baths === 1 ? '' : 's'}`;
      base = `${bedLabel} · ${bathLabel}`;
    }
    const extra: string[] = [];
    const tier = homeSqFtTierById(this.homeSqFtTierId);
    if (tier) extra.push(tier.label);
    if (this.hasPets) extra.push('Pets in home');
    return extra.length ? `${base} · ${extra.join(' · ')}` : base;
  }

  itemKey(section: ChecklistSection, item: string): string {
    return `${section.title}|${item}`;
  }

  isChecked(section: ChecklistSection, item: string): boolean {
    return this.checkedItems.has(this.itemKey(section, item));
  }

  toggleChecked(section: ChecklistSection, item: string): void {
    const key = this.itemKey(section, item);
    if (this.checkedItems.has(key)) {
      this.checkedItems.delete(key);
    } else {
      this.checkedItems.add(key);
    }
    this.checkedItems = new Set(this.checkedItems);
    this.selectedTasksService.setSelectedTasks(this.getSelectedTasks());
    this.syncCostToService();
  }

  getSelectedTasks(): SelectedTask[] {
    return Array.from(this.checkedItems).map((key) => {
      const [sectionTitle, ...taskParts] = key.split('|');
      return { sectionTitle, task: taskParts.join('|') };
    });
  }

  bookNow(): void {
    const selectedTasks = this.getSelectedTasks();
    this.selectedTasksService.setSelectedTasks(selectedTasks);
    this.selectedTasksService.setNumberOfBedrooms(this.numberOfBedrooms);
    this.selectedTasksService.setNumberOfBathrooms(this.numberOfBathrooms);
    this.selectedTasksService.setNumberOfCleaners(this.numberOfCleaners);
    this.selectedTasksService.setHourlyDurationHours(this.hourlyDurationHours);
    this.selectedTasksService.setHasPets(this.hasPets);
    this.selectedTasksService.setHomeSqFtTierId(this.homeSqFtTierId);
    this.syncCostToService();
    this.router.navigate(['/booking'], {
      state: {
        selectedTasks,
        numberOfRooms: this.numberOfRooms,
        numberOfBedrooms: this.numberOfBedrooms,
        numberOfBathrooms: this.numberOfBathrooms,
        numberOfCleaners: this.numberOfCleaners,
        hourlyDurationHours: this.hourlyDurationHours,
        hasPets: this.hasPets,
        homeSqFtTierId: this.homeSqFtTierId,
        estimatedCost: this.estimatedCost,
        currency: this.currency,
        selectedSectionsWithPrices: this.receiptLines.map((line) => ({ ...line })),
      },
    });
  }

  toggle(section: ChecklistSection): void {
    if (this.expanded.has(section.title)) {
      this.expanded.delete(section.title);
    } else {
      this.expanded.add(section.title);
    }
    this.expanded = new Set(this.expanded);
  }

  isExpanded(title: string): boolean {
    return this.expanded.has(title);
  }

  trackByTitle(_index: number, section: ChecklistSection): string {
    return section.title;
  }
}
