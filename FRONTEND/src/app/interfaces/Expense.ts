export interface Expense {
  id?: number;
  tripId: number;
  description: string;
  amount: number;
  payerId: number; // El ID del usuario que pagó
  date: string;
}