/**
 * Domain model: a promotional offer shown on the site and managed in admin.
 * Aligns 1:1 with API responses (`OfferDto`).
 */
export interface Offer {
  id: string;
  title: string;
  summary: string;
  detail: string;
  badge: string | null;
  /** Discount as a percentage (e.g. 15 = 15% off). Omit or null when not used. */
  discountPercent: number | null;
  sortOrder: number;
  isActive: boolean;
}
