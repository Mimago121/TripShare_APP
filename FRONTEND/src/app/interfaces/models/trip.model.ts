import { MemberMini } from './user.model';

export interface Trip {
  id: number;
  name: string;
  origin: string | null;
  destination: string;
  startDate: string;
  endDate: string;

  // datos extra para la UI
  createdAt?: string;
  imageUrl?: string | null;
  members: MemberMini[];
}
