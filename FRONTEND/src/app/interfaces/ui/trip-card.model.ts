import { MemberMini } from './member-mini.model';
//se usa en listas y cards
export interface TripCard {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  members: MemberMini[];
}
