import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ==========================================
// INTERFACES DE RESPUESTA (LO QUE RECIBES)
// ==========================================
export interface Trip {
  id?: number;
  name: string;
  destination: string;
  origin?: string;
  startDate: string;
  endDate: string;
  createdByUserId: number;
}

export interface Activity { id: number; title: string; startDatetime: string; endDatetime: string; }
export interface Expense { id: number; description: string; amount: number; paidByUserId: number; }
export interface Memory { id: number; type: string; description: string; mediaUrl: string; }

// ==========================================
// INTERFACES DE PETICIÓN (LO QUE ENVÍAS)
// ==========================================
export interface CreateActivityRequest {
  tripId: number;
  title: string;
  startDatetime: string;
  endDatetime: string;
  createdByUserId: number;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  paidByUserId: number;
}

export interface CreateMemoryRequest {
  userId: number;
  type: string; // 'photo' | 'note'
  description: string;
  mediaUrl: string;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private baseUrl = 'http://localhost:8080/trips';

  constructor(private http: HttpClient) {}

  // ==========================================
  // GETTERS (LECTURA)
  // ==========================================

  getMyTrips(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/user/${userId}`);
  }

  getTripById(tripId: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${tripId}`);
  }

  getActivities(tripId: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.baseUrl}/${tripId}/activities`);
  }

  getExpenses(tripId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/${tripId}/expenses`);
  }

  getMemories(tripId: number): Observable<Memory[]> {
    return this.http.get<Memory[]>(`${this.baseUrl}/${tripId}/memories`);
  }

  // ==========================================
  // ADDERS (ESCRITURA) - ¡NUEVOS!
  // ==========================================

  addActivity(tripId: number, data: CreateActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.baseUrl}/${tripId}/activities`, data);
  }

  addExpense(tripId: number, data: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/${tripId}/expenses`, data);
  }

  addMemory(tripId: number, data: CreateMemoryRequest): Observable<Memory> {
    return this.http.post<Memory>(`${this.baseUrl}/${tripId}/memories`, data);
  }
}