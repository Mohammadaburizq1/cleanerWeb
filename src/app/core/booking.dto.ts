/** POST /api/Booking — matches OpenAPI `CreateBookingDto` (cleaning-app v1). */
export interface CreateBookingDto {
  /** Required by backend validation (maps to CustomerFullName). */
  customerFullName: string;
  /** Required by backend validation (maps to CustomerEmail). */
  customerEmail: string;
  /** Optional in backend model (maps to CustomerPhone). */
  customerPhone: string | null;
  date: string;
  address: string;
  notes: string | null;
  /**
   * When the user is signed in, send fresh `MeDto.id` from GET /api/Auth/me.
   * Avoids relying only on email matching and prevents backend 400s.
   */
  registeredUserId?: string;

  /**
   * OpenAPI: optional subscription plan % off quote sub-total (0–100).
   * Sent as weekly/biweekly/monthly schedule discount (0 for one-time).
   */
  discountPercent?: number;
  /**
   * OpenAPI: optional final amount charged (after discounts & tax), max 1_000_000.
   * JSON property name is `total`, not `totalUsd`.
   */
  total?: number;

  /**
   * Home-size tier base only (e.g. 199). Not in the published OpenAPI snippet — send if your
   * API entity binds `BaseAmount` on create; otherwise omit or extend Swagger on the server.
   */
  baseAmount?: number;
}

/** GET responses — matches OpenAPI `BookingDto`. */
export interface BookingDto {
  id: string;
  date: string;
  address: string;
  notes: string | null;
  status: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string | null;
  baseAmount?: number;
  discountPercent?: number;
  total?: number;
  registeredUserId?: string | null;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string;
  price: number | string;
}
