export interface CreateFeedbackDto {
  bookingId: string | null;
  rating: number | string;
  comment: string | null;
}

export interface FeedbackDto {
  id: string;
  userId: string | null;
  userName: string;
  bookingId: string | null;
  rating: number | string;
  comment: string | null;
  createdAt: string; // ISO date-time
}

