/** POST /api/Booking — OpenAPI CreateBookingDto (no userId; guest-friendly). */
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
}

export interface BookingDto {
  id: string;
  date: string;
  address: string;
  notes: string | null;
  status: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string | null;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string;
  price: number | string;
}
