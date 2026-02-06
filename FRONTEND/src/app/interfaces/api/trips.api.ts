export interface TripResponse {
  id: number;
  name: string;
  destination: string;
  origin: string | null;
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;     // "YYYY-MM-DD"
  createdByUserId: number;
}

export interface CreateTripRequest {
  name: string;
  destination: string;
  origin: string | null;
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;     // "YYYY-MM-DD"
  createdByUserId: number;
}
