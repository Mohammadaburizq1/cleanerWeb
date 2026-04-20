import { CLEANING_CHECKLIST_SECTIONS, type ChecklistSection } from './cleaning-checklist.data';
import type { ReceiptLine } from './selected-tasks.service';

export const QUOTE_PRICE_PER_BEDROOM = 20;
export const QUOTE_PRICE_PER_BATHROOM = 25;
export const QUOTE_HOURLY_RATE_PER_CLEANER = 20;
/** Extra JD when pets are in the home */
export const QUOTE_PET_SURCHARGE_JD = 8;

/** Home size buckets for Step 1 (base price in USD for the home size). */
export const HOME_SQ_FT_TIERS: readonly { readonly id: string; readonly label: string; readonly surchargeJd: number }[] =
  [
    { id: 'sqft_1_999', label: '1 – 999 sq ft', surchargeJd: 199 },
    { id: 'sqft_1000_1499', label: '1,000 – 1,499 sq ft', surchargeJd: 209 },
    { id: 'sqft_1500_1999', label: '1,500 – 1,999 sq ft', surchargeJd: 239 },
    { id: 'sqft_2000_2499', label: '2,000 – 2,499 sq ft', surchargeJd: 249 },
    { id: 'sqft_2500_2999', label: '2,500 – 2,999 sq ft', surchargeJd: 259 },
    { id: 'sqft_3000_3499', label: '3,000 – 3,499 sq ft', surchargeJd: 275 },
    { id: 'sqft_3500_3999', label: '3,500 – 3,999 sq ft', surchargeJd: 279 },
    { id: 'sqft_4000_4499', label: '4,000 – 4,499 sq ft', surchargeJd: 289 },
  ];

export function homeSqFtTierById(id: string | null | undefined) {
  if (id == null || id === '') return undefined;
  return HOME_SQ_FT_TIERS.find((t) => t.id === id);
}

/** Migrate old numeric sq ft from storage to a tier id. */
export function legacySqFtToTierId(sqft: number): string | null {
  if (!(typeof sqft === 'number') || sqft < 0) return null;
  if (sqft <= 999) return 'sqft_1_999';
  if (sqft <= 1499) return 'sqft_1000_1499';
  if (sqft <= 1999) return 'sqft_1500_1999';
  if (sqft <= 2499) return 'sqft_2000_2499';
  if (sqft <= 2999) return 'sqft_2500_2999';
  if (sqft <= 3499) return 'sqft_3000_3499';
  if (sqft <= 3999) return 'sqft_3500_3999';
  if (sqft <= 4499) return 'sqft_4000_4499';
  return 'sqft_4000_4499';
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

function checkedTotalInSection(section: ChecklistSection, checked: Set<string>): number {
  let sum = 0;
  for (const item of section.items) {
    if (!checked.has(itemKey(section, item))) continue;
    const perItem = section.itemPrices?.[item];
    sum += typeof perItem === 'number' ? perItem : section.pricePerTask;
  }
  return sum;
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
      const amount = checkedTotalInSection(section, checked);
      const isVariable = !!section.itemPrices && Object.keys(section.itemPrices).length > 0;
      return isVariable
        ? { title: section.title, amount }
        : { title: section.title, taskCount, pricePerTask: section.pricePerTask, amount };
    });

  const isHourly = (input.numberOfBedrooms ?? 0) === 0;

  const tier = homeSqFtTierById(input.homeSqFtTierId);
  const tierAmount = tier?.surchargeJd ?? 0;
  const petAmount = input.hasPets ? QUOTE_PET_SURCHARGE_JD : 0;

  // Add-ons (Step 2) always add on top of the base.
  const selectedSectionsTotal = checklist
    .filter((s) => hasSectionAnyChecked(s, checked))
    .reduce((sum, s) => sum + checkedTotalInSection(s, checked), 0);

  // Pricing rule:
  // - Standard service (non-hourly): base price comes from home size tier (e.g. 1–999 sq ft => 199)
  //   PLUS $20 for each additional bedroom above 1, and $25 for each additional bathroom above 1.
  // - Hourly service: base price is hourlyRate * cleaners * hours (home size tier can still add as a line item if selected)
  let baseCost = 0;
  if (isHourly) {
    const cleaners = input.numberOfCleaners ?? 1;
    const hours = input.hourlyDurationHours ?? 0;
    baseCost = QUOTE_HOURLY_RATE_PER_CLEANER * cleaners * hours;
  } else {
    const beds = Math.max(1, input.numberOfBedrooms ?? 1);
    const baths = Math.max(1, input.numberOfBathrooms ?? 1);
    const extraBeds = Math.max(0, beds - 1);
    const extraBaths = Math.max(0, baths - 1);
    baseCost = tierAmount + extraBeds * QUOTE_PRICE_PER_BEDROOM + extraBaths * QUOTE_PRICE_PER_BATHROOM;
  }

  if (tierAmount > 0) {
    selectedSectionsWithPrices.push({
      title: `Home size: ${tier!.label}`,
      amount: tierAmount,
    });
  }
  if (!isHourly) {
    const beds = Math.max(1, input.numberOfBedrooms ?? 1);
    const baths = Math.max(1, input.numberOfBathrooms ?? 1);
    const extraBeds = Math.max(0, beds - 1);
    const extraBaths = Math.max(0, baths - 1);
    if (extraBeds > 0) {
      selectedSectionsWithPrices.push({
        title: `Extra bedrooms (${extraBeds} × ${QUOTE_PRICE_PER_BEDROOM})`,
        amount: extraBeds * QUOTE_PRICE_PER_BEDROOM,
      });
    }
    if (extraBaths > 0) {
      selectedSectionsWithPrices.push({
        title: `Extra bathrooms (${extraBaths} × ${QUOTE_PRICE_PER_BATHROOM})`,
        amount: extraBaths * QUOTE_PRICE_PER_BATHROOM,
      });
    }
  }
  if (petAmount > 0) {
    selectedSectionsWithPrices.push({
      title: 'Pets in home',
      amount: petAmount,
    });
  }

  const estimatedCost = baseCost + selectedSectionsTotal + petAmount;

  return { estimatedCost, selectedSectionsWithPrices };
}
