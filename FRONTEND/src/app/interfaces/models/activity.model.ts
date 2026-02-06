export interface Activity {
  id: number;
  tripId: number;
  title: string;
  startDatetime: string;
  endDatetime: string;
  createdByUserId: number;

  // extra UI opcional (por ejemplo, para mostrar "solapa")
  overlaps?: boolean;
}
