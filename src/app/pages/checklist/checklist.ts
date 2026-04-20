import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  STANDARD_INCLUDED_SECTIONS,
  type ChecklistSection,
} from '../../core/cleaning-checklist.data';
import { computeServicesQuote } from '../../core/services-quote';
import { type SelectedTask, SelectedTasksService } from '../../core/selected-tasks.service';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checklist.html',
  styleUrl: './checklist.scss',
})
export class Checklist implements OnInit {
  readonly sectionTag = 'Cleaning checklist';
  readonly mainHeading = 'Included in Every Cleaning';
  readonly intro =
    'These are the tasks we cover on a standard visit. Check boxes to match what you want emphasized; your selections stay in sync with your quote on the Services page.';

  readonly sections = STANDARD_INCLUDED_SECTIONS;
  readonly currency = 'USD';

  expanded = new Set<string>(this.sections.map((s) => s.title));
  checkedItems = new Set<string>();

  private selectedTasksService = inject(SelectedTasksService);

  ngOnInit(): void {
    const saved = this.selectedTasksService.getSelectedTasks();
    this.checkedItems = new Set(saved.map((t) => `${t.sectionTitle}|${t.task}`));
    this.syncCostToService();
  }

  private syncCostToService(): void {
    const { estimatedCost, selectedSectionsWithPrices } = computeServicesQuote({
      numberOfBedrooms: this.selectedTasksService.getNumberOfBedrooms(),
      numberOfBathrooms: this.selectedTasksService.getNumberOfBathrooms(),
      numberOfCleaners: this.selectedTasksService.getNumberOfCleaners(),
      hourlyDurationHours: this.selectedTasksService.getHourlyDurationHours(),
      checkedItemKeys: this.checkedItems,
      hasPets: this.selectedTasksService.getHasPets(),
      homeSqFtTierId: this.selectedTasksService.getHomeSqFtTierId(),
    });
    this.selectedTasksService.setCostDetails({
      estimatedCost,
      selectedSectionsWithPrices,
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
    return Array.from(this.checkedItems).map((k) => {
      const [sectionTitle, ...taskParts] = k.split('|');
      return { sectionTitle, task: taskParts.join('|') };
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

  /** Opens the print dialog; choose Save as PDF to download. Uses landscape so the 3 columns fit on one sheet. */
  printChecklist(): void {
    const id = 'checklist-print-page-style';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = '@page { size: landscape; margin: 0.22in; }';
    const remove = (): void => {
      style?.remove();
      window.removeEventListener('afterprint', remove);
    };
    window.addEventListener('afterprint', remove);
    window.print();
  }
}
