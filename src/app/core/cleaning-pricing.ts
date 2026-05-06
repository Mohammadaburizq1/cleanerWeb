export type HomeSqFtTier = { id: string; label: string; basePriceUsd: number };

/**
 * Single source of truth for base cleaning pricing and subscription plan discounts.
 * Promotional offers from the API are separate (booking page).
 */
export const CLEANING_PRICING = {
  currency: 'USD' as const,

  /** Base cleaning price by area range (final price). */
  homeSqFtTiers: [
    { id: 'sqft_1_999', label: '1 – 999 sq ft', basePriceUsd: 199 },
    { id: 'sqft_1000_1499', label: '1,000 – 1,499 sq ft', basePriceUsd: 209 },
    { id: 'sqft_1500_1999', label: '1,500 – 1,999 sq ft', basePriceUsd: 239 },
    { id: 'sqft_2000_2499', label: '2,000 – 2,499 sq ft', basePriceUsd: 249 },
    { id: 'sqft_2500_2999', label: '2,500 – 2,999 sq ft', basePriceUsd: 259 },
    { id: 'sqft_3000_3499', label: '3,000 – 3,499 sq ft', basePriceUsd: 275 },
    { id: 'sqft_3500_3999', label: '3,500 – 3,999 sq ft', basePriceUsd: 279 },
    { id: 'sqft_4000_4499', label: '4,000 – 4,499 sq ft', basePriceUsd: 289 },
  ] as const satisfies readonly HomeSqFtTier[],

  /** Suite extras (per additional room/bathroom above 1). */
  suiteExtras: {
    extraRoomUsd: 20, // “Every extra room in suite”
    extraBathroomUsd: 25, // “Every extra bathroom in suite”
  },

  /** Optional surcharges */
  surcharges: {
    petsInHomeUsd: 50,
  },

  /** Add-ons / extra services (fixed prices). */
  addOns: {
    interiorDeepCleaningUsd: 50,
    exteriorHouseCleaningUsd: 70,
    extraCleaningHourUsd: 5,
    changeBulbsOrChandelierUsd: 5,
    sofaCleaningUsd: 10,
    smallAcCleaningUsd: 7,
    everyExtra30MinutesUsd: 20,
  },

  /**
   * Recurring booking schedule: percent off the quote sub-total (before optional promo offer).
   * Form values: weekly / biweekly / monthly (one_time → no plan discount).
   */
  subscriptionPlanDiscountPercent: {
    weekly: 45,
    biweekly: 35,
    monthly: 25,
  },
} as const;

/** Percent off sub-total for the booking form `schedule` control (0 for one_time / unknown). */
export function subscriptionDiscountPercentForSchedule(schedule: string | null | undefined): number {
  const v = (schedule ?? '').toString().trim();
  const d = CLEANING_PRICING.subscriptionPlanDiscountPercent;
  if (v === 'weekly') return d.weekly;
  if (v === 'biweekly') return d.biweekly;
  if (v === 'monthly') return d.monthly;
  return 0;
}

export function homeSqFtTierById(id: string | null | undefined): HomeSqFtTier | undefined {
  const v = (id ?? '').trim();
  if (!v) return undefined;
  return CLEANING_PRICING.homeSqFtTiers.find((t) => t.id === v);
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

