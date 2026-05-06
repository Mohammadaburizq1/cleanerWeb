import { CLEANING_CHECKLIST_SECTIONS, type ChecklistSection } from './cleaning-checklist.data';
import type { ReceiptLine } from './selected-tasks.service';
import { CLEANING_PRICING, homeSqFtTierById } from './cleaning-pricing';
export { homeSqFtTierById, legacySqFtToTierId } from './cleaning-pricing';

export const HOME_SQ_FT_TIERS = CLEANING_PRICING.homeSqFtTiers.map((t) => ({
  id: t.id,
  label: t.label,
  /** Kept name for compatibility with existing UI/templates (represents final base price). */
  surchargeJd: t.basePriceUsd,
})) as readonly { readonly id: string; readonly label: string; readonly surchargeJd: number }[];

export const QUOTE_PRICE_PER_BEDROOM = CLEANING_PRICING.suiteExtras.extraRoomUsd;
export const QUOTE_PRICE_PER_BATHROOM = CLEANING_PRICING.suiteExtras.extraBathroomUsd;
/** Hourly mode is not used for pricing (kept for compatibility; treated as 0). */
export const QUOTE_HOURLY_RATE_PER_CLEANER = 0;
/** Pets surcharge (added when pets are in the home). */
export const QUOTE_PET_SURCHARGE_JD = CLEANING_PRICING.surcharges.petsInHomeUsd;

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

  const tier = homeSqFtTierById(input.homeSqFtTierId);
  const tierAmount = tier?.basePriceUsd ?? 0;
  const petAmount = input.hasPets ? QUOTE_PET_SURCHARGE_JD : 0;

  // Add-ons (Step 2) always add on top of the base.
  const selectedSectionsTotal = checklist
    .filter((s) => hasSectionAnyChecked(s, checked))
    .reduce((sum, s) => sum + checkedTotalInSection(s, checked), 0);

  // Pricing rule (no discounts):
  // - Base price comes from home size tier (per provided table).
  // - Add suite extras: $20 per extra room (bedroom) above 1, $25 per extra bathroom above 1.
  let baseCost = 0;
  const beds = Math.max(1, input.numberOfBedrooms ?? 1);
  const baths = Math.max(1, input.numberOfBathrooms ?? 1);
  const extraBeds = Math.max(0, beds - 1);
  const extraBaths = Math.max(0, baths - 1);
  baseCost = tierAmount + extraBeds * QUOTE_PRICE_PER_BEDROOM + extraBaths * QUOTE_PRICE_PER_BATHROOM;

  if (tierAmount > 0) {
    selectedSectionsWithPrices.push({
      title: `Home size: ${tier!.label}`,
      amount: tierAmount,
    });
  }
  if (extraBeds > 0) {
    selectedSectionsWithPrices.push({
      title: `Every extra room in suite (${extraBeds} × ${QUOTE_PRICE_PER_BEDROOM})`,
      amount: extraBeds * QUOTE_PRICE_PER_BEDROOM,
    });
  }
  if (extraBaths > 0) {
    selectedSectionsWithPrices.push({
      title: `Every extra bathroom in suite (${extraBaths} × ${QUOTE_PRICE_PER_BATHROOM})`,
      amount: extraBaths * QUOTE_PRICE_PER_BATHROOM,
    });
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
