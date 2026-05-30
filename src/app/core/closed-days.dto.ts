/** Response: GET /api/ClosedDays, POST /api/ClosedDays */
export interface ClosedDayDto {
  id: string;
  /** Local calendar date `YYYY-MM-DD`. */
  date: string;
  /** Optional note shown to admins (e.g. holiday, staff off). */
  reason?: string | null;
}

/** Body: POST /api/ClosedDays */
export interface CreateClosedDayDto {
  date: string;
  reason?: string | null;
}
