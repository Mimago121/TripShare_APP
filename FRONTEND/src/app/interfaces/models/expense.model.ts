export interface Expense {
  id: number;
  tripId: number;
  paidByUserId: number;
  description: string;
  amount: number;
  createdAt: string;

  // extras UI típicos
  paidByName?: string;
}
