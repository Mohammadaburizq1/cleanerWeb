export interface CreateFeedbackDto {
  userId?: string | null;
  guestUserName?: string | null;
  /** Optional guest email (OpenAPI `CreateFeedbackDto.guestEmail`, max 320). */
  guestEmail?: string | null;
  bookingId?: string | null;
  rating: number | string;
  comment?: string | null;
}

export interface FeedbackDto {
  id: string;
  userId: string | null;
  userName: string;
  email?: string | null;
  bookingId: string | null;
  rating: number | string;
  comment: string | null;
  createdAt: string;
}
