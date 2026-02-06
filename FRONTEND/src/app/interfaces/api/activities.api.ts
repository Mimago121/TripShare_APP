export interface ActivityResponse {
  id: number;
  tripId: number;
  title: string;
  startDatetime: string; // ISO string recomendado
  endDatetime: string;
  createdByUserId: number;
}

export interface CreateActivityRequest {
  tripId: number;
  title: string;
  startDatetime: string;
  endDatetime: string;
  createdByUserId: number;
}
