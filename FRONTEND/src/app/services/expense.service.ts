import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Expense } from '../interfaces/Expense';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private url = 'http://localhost:8080/api/expenses';

  getExpensesByTrip(tripId: number) {
    return this.http.get<Expense[]>(`${this.url}/trip/${tripId}`);
  }

  addExpense(expense: Expense) {
    return this.http.post<Expense>(this.url, expense);
  }
}