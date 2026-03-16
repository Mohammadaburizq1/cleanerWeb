import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { type ReceiptLine, SelectedTasksService } from '../../core/selected-tasks.service';

export type SelectedTask = { sectionTitle: string; task: string };

export type ChecklistSection = {
  title: string;
  items: string[];
  /** Amount (e.g. in JD) added per checked task in this section */
  pricePerTask: number;
  subtitle?: string;
};

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
    'We’re transparent about what we do. Expand any section to see every task included.';

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

  readonly checklist: ChecklistSection[] = [
    {
      title: 'Kitchen',
      pricePerTask: 1,
      items: [
        'Empty Trash',
        'Dust from Top to Bottom',
        'Dust Light Fixtures and Fans',
        'Dust Baseboards',
        'Dust Blinds and Window Sills',
        'Sinks',
        'Backsplash',
        'Cabinets — Dusted and Spot Checked',
        'All Countertops',
        'Small Appliances',
        'Glass Doors',
        'Microwave',
        'Polish Stainless Steel',
        'Dishwasher (Outside Only)',
        'Stovetop and Stove Fan',
        'Oven (Outside Only)',
        'Outside Fridge',
        'Floors Vacuumed',
        'Floors Mopped',
      ],
    },
    {
      title: 'Living Areas & Bedroom',
      pricePerTask: 1,
      items: [
        'Dust from Top to Bottom',
        'Dust Light Fixtures and Fans',
        'Dust Baseboards',
        'Dust Blinds & Window Sills',
        'Throw Rugs Vacuumed',
        'Empty Trash',
        'Clean All Mirrors',
        'Dust Furniture and Decorations',
        'Clean All Glass Surfaces',
        'Remove Fingerprints / Smudges',
        'Straighten and Make Presentable',
        'Make Beds',
        'Vacuum All Floors',
        'Mop Hard Surface Flooring',
        'Vacuum Stairs',
      ],
    },
    {
      title: 'Bathrooms',
      pricePerTask: 1,
      items: [
        'Dust from Top to Bottom',
        'Dust Light Fixtures and Fans',
        'Dust Baseboards',
        'Dust Blinds and Window Sills',
        'Sinks',
        'Countertops',
        'Mirrors',
        'Faucets (also polished)',
        'Toilet',
        'Empty Trash',
        'Shower Stall',
        'Remove Soap Scum',
        'Bathtub',
        'Shower Racks (as able)',
        'Towels Folded and Hung',
        'Straighten and Make Presentable',
        'Floors Vacuumed',
        'Floors Mopped',
      ],
    },
    {
      title: 'Deep Clean',
      pricePerTask: 3,
      items: [
        'Hand Wash Baseboards',
        'Hand Wash Wood Trim',
        'Hand Wash Outsides of Cabinets',
        'Full Soap Scum Buildup Removal',
        'Kitchen Grease & Buildup Removal',
      ],
    },
    {
      title: 'Moving Clean',
      pricePerTask: 5,
      subtitle: 'Everything in a Deep Clean, plus',
      items: ['Inside Empty Cabinets'],
    },
    {
      title: 'Upgrades',
      pricePerTask: 2,
      items: [
        'Changing Linens',
        'Interior of Fridge & Freezer',
        'Interior of Oven',
        'Interior Windows',
        'Vacuum Sectional / Large Couch',
        'Vacuum Small Couch',
      ],
    },
  ];

  /** Sections included in every standard cleaning */
  readonly includedSections = this.checklist.slice(0, 3);
  /** Add-on services (Deep Clean, Moving Clean, Upgrades) */
  readonly addOnSections = this.checklist.slice(3);

  /** Which section titles are expanded (multiple can be open) */
  expanded = new Set<string>();

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

  /** Extra amount per room (added on top of selected-section total) */
  readonly pricePerRoom = 5;
  /** Hourly rate per cleaner (used when Hourly Service is selected) */
  readonly hourlyRatePerCleaner = 20;
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
    this.syncCostToService();
  }

  /** True when user selected "Hourly Service" (bedrooms = 0) */
  get isHourlyService(): boolean {
    return (this.numberOfBedrooms ?? 0) === 0;
  }

  private syncCostToService(): void {
    const lines: ReceiptLine[] = this.selectedSectionsWithPrices.map(
      ({ section, taskCount, pricePerTask, amount }) => ({
        title: section.title,
        taskCount,
        pricePerTask,
        amount,
      }),
    );
    this.selectedTasksService.setCostDetails({
      estimatedCost: this.estimatedCost,
      selectedSectionsWithPrices: lines,
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

  /** Number of checked items in a section */
  checkedCountInSection(section: ChecklistSection): number {
    return section.items.filter((item) => this.checkedItems.has(this.itemKey(section, item))).length;
  }

  /** Whether at least one item in this section is checked */
  hasSectionAnyChecked(section: ChecklistSection): boolean {
    return this.checkedCountInSection(section) > 0;
  }

  /** Sum of (checked count × price per task) for all sections */
  get selectedSectionsTotal(): number {
    return this.checklist
      .filter((s) => this.hasSectionAnyChecked(s))
      .reduce(
        (sum, s) => sum + this.checkedCountInSection(s) * s.pricePerTask,
        0,
      );
  }

  /** Estimated cost: for hourly = rate × hours × cleaners; else tasks + rooms × price per room */
  get estimatedCost(): number {
    if (this.isHourlyService) {
      const cleaners = this.numberOfCleaners ?? 1;
      const hours = this.hourlyDurationHours ?? 0;
      return this.hourlyRatePerCleaner * cleaners * hours;
    }
    const rooms = this.numberOfRooms != null && this.numberOfRooms >= 0 ? this.numberOfRooms : 0;
    return this.selectedSectionsTotal + rooms * this.pricePerRoom;
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
    if (beds <= 0) {
      const cleaners = this.numberOfCleaners ?? 1;
      const hours = this.hourlyDurationHours ?? 0;
      const cleanerLabel = this.cleanerOptions.find((o) => o.value === cleaners)?.label ?? `${cleaners} Cleaner${cleaners === 1 ? '' : 's'}`;
      const hourLabel = this.hourOptions.find((o) => o.value === hours)?.label ?? `${hours} Hours`;
      return `Hourly Service · ${cleanerLabel} · ${hourLabel}`;
    }
    const baths = this.numberOfBathrooms ?? 0;
    const bedLabel = this.bedroomOptions.find((o) => o.value === beds)?.label ?? `${beds} Bedroom${beds === 1 ? '' : 's'}`;
    const bathLabel =
      baths <= 0
        ? '0 Bathrooms'
        : this.bathroomOptions.find((o) => o.value === baths)?.label ?? `${baths} Bathroom${baths === 1 ? '' : 's'}`;
    return `${bedLabel} · ${bathLabel}`;
  }

  /** Receipt line: section, task count, price per task, amount (for breakdown) */
  get selectedSectionsWithPrices(): {
    section: ChecklistSection;
    taskCount: number;
    pricePerTask: number;
    amount: number;
  }[] {
    return this.checklist
      .filter((s) => this.hasSectionAnyChecked(s))
      .map((section) => {
        const taskCount = this.checkedCountInSection(section);
        const amount = taskCount * section.pricePerTask;
        return { section, taskCount, pricePerTask: section.pricePerTask, amount };
      });
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
    this.router.navigate(['/booking'], {
      state: {
        selectedTasks,
        numberOfRooms: this.numberOfRooms,
        numberOfBedrooms: this.numberOfBedrooms,
        numberOfBathrooms: this.numberOfBathrooms,
        numberOfCleaners: this.numberOfCleaners,
        hourlyDurationHours: this.hourlyDurationHours,
        estimatedCost: this.estimatedCost,
        currency: this.currency,
        selectedSectionsWithPrices: this.selectedSectionsWithPrices.map(
          ({ section, taskCount, pricePerTask, amount }) => ({
            title: section.title,
            taskCount,
            pricePerTask,
            amount,
          }),
        ),
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
