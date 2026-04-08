export interface CreateFeedbackDto {
  userId?: string | null;
  guestUserName?: string | null;
  bookingId?: string | null;
  rating: number | string;
  comment?: string | null;
}

export interface FeedbackDto {
  id: string;
  userId: string | null;
  userName: string;
  bookingId: string | null;
  rating: number | string;
  comment: string | null;
  createdAt: string;
}
