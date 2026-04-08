import { CLEANING_CHECKLIST_SECTIONS, type ChecklistSection } from './cleaning-checklist.data';
import type { ReceiptLine } from './selected-tasks.service';

export const QUOTE_PRICE_PER_BEDROOM = 5;
export const QUOTE_PRICE_PER_BATHROOM = 5;
export const QUOTE_HOURLY_RATE_PER_CLEANER = 20;
/** Extra JD when pets are in the home */
export const QUOTE_PET_SURCHARGE_JD = 8;

/** Home size buckets for Step 1 (surcharge in JD added to every quote). */
export const HOME_SQ_FT_TIERS: readonly { readonly id: string; readonly label: string; readonly surchargeJd: number }[] =
  [
    { id: 'sqft_u1000', label: 'Up to 1,000 sq ft', surchargeJd: 6 },
    { id: 'sqft_1001_1500', label: '1,001 – 1,500 sq ft', surchargeJd: 12 },
    { id: 'sqft_1501_2000', label: '1,501 – 2,000 sq ft', surchargeJd: 18 },
    { id: 'sqft_2001_2500', label: '2,001 – 2,500 sq ft', surchargeJd: 24 },
    { id: 'sqft_2501_3500', label: '2,501 – 3,500 sq ft', surchargeJd: 32 },
    { id: 'sqft_o3500', label: 'Over 3,500 sq ft', surchargeJd: 42 },
  ];

export function homeSqFtTierById(id: string | null | undefined) {
  if (id == null || id === '') return undefined;
  return HOME_SQ_FT_TIERS.find((t) => t.id === id);
}

/** Migrate old numeric sq ft from storage to a tier id. */
export function legacySqFtToTierId(sqft: number): string | null {
  if (!(typeof sqft === 'number') || sqft < 0) return null;
  if (sqft <= 1000) return 'sqft_u1000';
  if (sqft <= 1500) return 'sqft_1001_1500';
  if (sqft <= 2000) return 'sqft_1501_2000';
  if (sqft <= 2500) return 'sqft_2001_2500';
  if (sqft <= 3500) return 'sqft_2501_3500';
  return 'sqft_o3500';
}

function itemKey(section: ChecklistSection, item: string): string {
  return `${section.title}|${item}`;
}

function checkedCountInSection(section: ChecklistSection, checked: Set<string>): number {
  return section.items.filter((item) => checked.has(itemKey(section, item))).length;
}

function hasSectionAnyChecked(section: ChecklistSection, checked: Set<string>): boolean {
  return checkedCountInSection(section, checked) > 0;
}

/** Matches Services page pricing: hourly ignores per-task add-ons in the total; receipt still lists checked tasks. Home size tier and pets always add to the total. */
export function computeServicesQuote(input: {
  numberOfBedrooms: number | null;
  numberOfBathrooms: number | null;
  numberOfCleaners: number | null;
  hourlyDurationHours: number | null;
  checkedItemKeys: Set<string>;
  hasPets: boolean;
  homeSqFtTierId: string | null;
}): { estimatedCost: number; selectedSectionsWithPrices: ReceiptLine[] } {
  const checklist = CLEANING_CHECKLIST_SECTIONS;
  const checked = input.checkedItemKeys;

  const selectedSectionsWithPrices: ReceiptLine[] = checklist
    .filter((s) => hasSectionAnyChecked(s, checked))
    .map((section) => {
      const taskCount = checkedCountInSection(section, checked);
      const pricePerTask = section.pricePerTask;
      const amount = taskCount * pricePerTask;
      return { title: section.title, taskCount, pricePerTask, amount };
    });

  const isHourly = (input.numberOfBedrooms ?? 0) === 0;

  let baseCost: number;
  if (isHourly) {
    const cleaners = input.numberOfCleaners ?? 1;
    const hours = input.hourlyDurationHours ?? 0;
    baseCost = QUOTE_HOURLY_RATE_PER_CLEANER * cleaners * hours;
  } else {
    const selectedSectionsTotal = checklist
      .filter((s) => hasSectionAnyChecked(s, checked))
      .reduce((sum, s) => sum + checkedCountInSection(s, checked) * s.pricePerTask, 0);
    const beds = Math.max(0, input.numberOfBedrooms ?? 0);
    const baths = Math.max(0, input.numberOfBathrooms ?? 0);
    baseCost =
      selectedSectionsTotal + beds * QUOTE_PRICE_PER_BEDROOM + baths * QUOTE_PRICE_PER_BATHROOM;
  }

  const tier = homeSqFtTierById(input.homeSqFtTierId);
  const tierAmount = tier?.surchargeJd ?? 0;
  const petAmount = input.hasPets ? QUOTE_PET_SURCHARGE_JD : 0;

  if (tierAmount > 0) {
    selectedSectionsWithPrices.push({
      title: `Home size: ${tier!.label}`,
      amount: tierAmount,
    });
  }
  if (petAmount > 0) {
    selectedSectionsWithPrices.push({
      title: 'Pets in home',
      amount: petAmount,
    });
  }

  const estimatedCost = baseCost + tierAmount + petAmount;

  return { estimatedCost, selectedSectionsWithPrices };
}
