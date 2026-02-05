export interface Trip {
  id?: number;
  name: string;
  destination: string;
  origin?: string;    // Ciudad de salida
  startDate: string;  // En el backend lo tratamos como String o Long
  endDate: string;
}