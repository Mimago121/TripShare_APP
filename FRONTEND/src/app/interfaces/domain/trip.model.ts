export interface Trip {
  id: number;
  name: string;
  origin: string | null;
  destination: string;
  startDate: string; // ISO date
  endDate: string;
  createdAt: string;
}
