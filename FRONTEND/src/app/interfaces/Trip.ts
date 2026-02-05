export interface Trip {
  id?: number;
  name: string;
  destination: string;
  origin?: string;
  startDate: string;
  endDate: string;
}