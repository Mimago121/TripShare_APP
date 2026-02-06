export interface Memory {
  id: number;
  tripId: number;
  userId: number;
  type: string;
  description: string | null;
  mediaUrl: string | null;
  createdAt: string;

  // extra UI
  userName?: string;
}
