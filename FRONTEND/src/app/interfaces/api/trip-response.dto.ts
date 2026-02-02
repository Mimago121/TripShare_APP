import { MemberMini } from '../ui/member-mini.model';

//esto es lo que el back devolvera

export interface TripResponse {
  id: number;
  name: string;
  origin: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  members: MemberMini[];
}
