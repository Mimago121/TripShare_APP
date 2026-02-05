import { MemberMini } from "./user.model";

export interface Trip {
  id: number;
  name: string;
  origin: string | null;
  destination: string;
  startDate: string; // ISO date
  endDate: string;
  createdAt: string;
  // imageUrl?: string | null;
  members: MemberMini[];
  // myStatus?: 'pending' | 'accepted'; // si el backend lo manda
}
