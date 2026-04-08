/** POST /api/Booking — OpenAPI CreateBookingDto (no userId; guest-friendly). */
export interface CreateBookingDto {
  serviceId: string;
  date: string;
  address: string;
  notes: string | null;
}

export interface BookingDto {
  id: string;
  serviceId: string;
  date: string;
  address: string;
  notes: string | null;
  status: string;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string;
  price: number | string;
}
