import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export type SelectedTask = { sectionTitle: string; task: string };

export type ReceiptLine = {
  title: string;
  taskCount?: number;
  pricePerTask?: number;
  amount: number;
};

export type BookingDetails = {
  selectedTasks: SelectedTask[];
  numberOfRooms: number | null;
  numberOfBedrooms?: number | null;
  numberOfBathrooms?: number | null;
  numberOfCleaners?: number | null;
  hourlyDurationHours?: number | null;
  estimatedCost?: number;
  currency?: string;
  selectedSectionsWithPrices?: ReceiptLine[];
};

const STORAGE_KEY = 'cleanhome-booking-details';
const CURRENCY = 'JD';

/**
 * Persists tasks and booking details (e.g. number of rooms) so any "Book Now"
 * can send the user to the booking page with selections, or to services if none.
 * Saves to localStorage so data survives refresh and closing the tab.
 */
@Injectable({ providedIn: 'root' })
export class SelectedTasksService {
  private tasks: SelectedTask[] = [];
  private rooms: number | null = null;
  private bedrooms: number | null = null;
  private bathrooms: number | null = null;
  private cleaners: number | null = null;
  private hourlyHours: number | null = null;
  private estimatedCost: number = 0;
  private selectedSectionsWithPrices: ReceiptLine[] = [];

  constructor(private router: Router) {
    this.loadFromStorage();
  }

  goToBookNow(): void {
    if (this.hasSelectedTasks()) {
      this.router.navigate(['/booking'], {
        state: {
          selectedTasks: this.getSelectedTasks(),
          numberOfRooms: this.getNumberOfRooms(),
          numberOfBedrooms: this.getNumberOfBedrooms(),
          numberOfBathrooms: this.getNumberOfBathrooms(),
          numberOfCleaners: this.getNumberOfCleaners(),
          hourlyDurationHours: this.getHourlyDurationHours(),
          estimatedCost: this.estimatedCost,
          currency: CURRENCY,
          selectedSectionsWithPrices: this.selectedSectionsWithPrices,
        },
      });
    } else {
      this.router.navigate(['/services']);
    }
  }

  setCostDetails(details: {
    estimatedCost: number;
    selectedSectionsWithPrices: ReceiptLine[];
  }): void {
    this.estimatedCost = details.estimatedCost;
    this.selectedSectionsWithPrices = details.selectedSectionsWithPrices;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BookingDetails | SelectedTask[];
        if (Array.isArray(parsed)) {
          this.tasks = parsed;
          this.rooms = null;
          this.bedrooms = null;
          this.bathrooms = null;
          this.cleaners = null;
          this.hourlyHours = null;
          this.estimatedCost = 0;
          this.selectedSectionsWithPrices = [];
        } else if (parsed && Array.isArray(parsed.selectedTasks)) {
          this.tasks = parsed.selectedTasks;
          this.rooms =
            typeof parsed.numberOfRooms === 'number' && parsed.numberOfRooms >= 0
              ? parsed.numberOfRooms
              : null;
          this.bedrooms =
            typeof parsed.numberOfBedrooms === 'number' && parsed.numberOfBedrooms >= 0
              ? parsed.numberOfBedrooms
              : null;
          this.bathrooms =
            typeof parsed.numberOfBathrooms === 'number' && parsed.numberOfBathrooms >= 0
              ? parsed.numberOfBathrooms
              : null;
          this.cleaners =
            typeof parsed.numberOfCleaners === 'number' && parsed.numberOfCleaners >= 1
              ? parsed.numberOfCleaners
              : null;
          this.hourlyHours =
            typeof parsed.hourlyDurationHours === 'number' && parsed.hourlyDurationHours > 0
              ? parsed.hourlyDurationHours
              : null;
          this.estimatedCost = typeof parsed.estimatedCost === 'number' ? parsed.estimatedCost : 0;
          const stored = parsed.selectedSectionsWithPrices;
          this.selectedSectionsWithPrices = Array.isArray(stored)
            ? stored.map((e: { title: string; price?: number; taskCount?: number; pricePerTask?: number; amount?: number }) => ({
                title: e.title,
                taskCount: e.taskCount,
                pricePerTask: e.pricePerTask,
                amount: typeof e.amount === 'number' ? e.amount : (e.price ?? 0),
              }))
            : [];
        }
      }
    } catch {
      this.tasks = [];
      this.rooms = null;
      this.bedrooms = null;
      this.bathrooms = null;
      this.cleaners = null;
      this.hourlyHours = null;
      this.estimatedCost = 0;
      this.selectedSectionsWithPrices = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedTasks: this.tasks,
          numberOfRooms: this.rooms,
          numberOfBedrooms: this.bedrooms,
          numberOfBathrooms: this.bathrooms,
          numberOfCleaners: this.cleaners,
          hourlyDurationHours: this.hourlyHours,
          estimatedCost: this.estimatedCost,
          currency: CURRENCY,
          selectedSectionsWithPrices: this.selectedSectionsWithPrices,
        }),
      );
    } catch {
      // ignore quota / private mode
    }
  }

  setSelectedTasks(tasks: SelectedTask[]): void {
    this.tasks = tasks;
    this.saveToStorage();
  }

  getSelectedTasks(): SelectedTask[] {
    return [...this.tasks];
  }

  hasSelectedTasks(): boolean {
    return this.tasks.length > 0;
  }

  setNumberOfRooms(value: number | null): void {
    this.rooms = value;
    this.saveToStorage();
  }

  getNumberOfRooms(): number | null {
    return this.rooms;
  }

  setNumberOfBedrooms(value: number | null): void {
    this.bedrooms = value;
    this.saveToStorage();
  }

  getNumberOfBedrooms(): number | null {
    return this.bedrooms;
  }

  setNumberOfBathrooms(value: number | null): void {
    this.bathrooms = value;
    this.saveToStorage();
  }

  getNumberOfBathrooms(): number | null {
    return this.bathrooms;
  }

  setNumberOfCleaners(value: number | null): void {
    this.cleaners = value;
    this.saveToStorage();
  }

  getNumberOfCleaners(): number | null {
    return this.cleaners;
  }

  setHourlyDurationHours(value: number | null): void {
    this.hourlyHours = value;
    this.saveToStorage();
  }

  getHourlyDurationHours(): number | null {
    return this.hourlyHours;
  }

  /** Clear all selected tasks, rooms, and cost details (e.g. after booking is submitted). */
  clearAll(): void {
    this.tasks = [];
    this.rooms = null;
    this.bedrooms = null;
    this.bathrooms = null;
    this.cleaners = null;
    this.hourlyHours = null;
    this.estimatedCost = 0;
    this.selectedSectionsWithPrices = [];
    this.saveToStorage();
  }
}
