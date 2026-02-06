export interface MemoryModel {
  id: number;
  tripId: number;
  userId: number;
  type: string;              // mejor: union type si definís tipos
  description: string | null;
  mediaUrl: string | null;
  createdAt: string;
}
