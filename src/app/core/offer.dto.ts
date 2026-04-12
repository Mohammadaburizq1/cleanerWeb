import type { Offer } from './offer.model';

/**
 * Wire types for `/api/Offer`.
 * Add `discountPercent` (nullable number) to your backend Offer DTO + DB column `DiscountPercent` if missing.
 */

/** Response: GET /api/Offer, GET /api/Offer/{id}, POST /api/Offer, PUT /api/Offer/{id} */
export type OfferDto = Offer;

/**
 * Body: POST /api/Offer
 * Required: title, summary, detail (per OpenAPI `required` array).
 */
export interface CreateOfferDto {
  /** maxLength 500 */
  title: string;
  /** maxLength 2000 */
  summary: string;
  detail: string;
  /** maxLength 200 */
  badge?: string | null;
  /** Discount percentage (e.g. 15); optional */
  discountPercent?: number | null;
  /** int32; optional on create */
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Body: PUT /api/Offer/{id}
 * Required: title, summary, detail
 */
export interface UpdateOfferDto {
  title: string;
  summary: string;
  detail: string;
  badge?: string | null;
  discountPercent?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}
