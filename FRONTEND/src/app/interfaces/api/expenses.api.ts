export interface ExpenseModel {
  id: number;
  tripId: number;
  paidByUserId: number;
  description: string;
  amount: number;      // cuidado con decimales
  createdAt: string;   // ISO string
}
