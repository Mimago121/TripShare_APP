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
  imageUrl?: string; 
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

export interface Member {
  id: number;
  userName: string;
  email: string;
  avatarUrl?: string; 
  role: string;       
  status: string;     
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private baseUrl = 'http://localhost:8080/trips';
  private friendsUrl = 'http://localhost:8080/friends';

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

  getMemories(tripId: number): Observable<any[]> {
    const uniqueUrl = `${this.baseUrl}/${tripId}/memories?t=${new Date().getTime()}`;
    return this.http.get<any[]>(uniqueUrl);
  }

  getUserMemories(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/users/${userId}/memories`);
  }

  // ==========================================
  // ADDERS (ESCRITURA)
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

  // ==========================================
  // MIEMBROS Y GESTIÓN
  // ==========================================

  getMyFriends(userId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.friendsUrl}/accepted/${userId}`);
  }

  getMembers(tripId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.baseUrl}/${tripId}/members`);
  }

  inviteMember(tripId: number, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${tripId}/invite`, { email });
  }

  // --- NUEVA FUNCIÓN: ELIMINAR MIEMBRO ---
  removeMember(tripId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${tripId}/members/${userId}`);
  }

  createTrip(tripData: any): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, tripData);
  }

  // ==========================================
  // INVITACIONES Y RESPUESTAS
  // ==========================================

  getInvitations(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/invitations/${userId}`);
  }

  respondToInvitation(tripId: number, userId: number, accept: boolean): Observable<any> {
    const body = {
      tripId: tripId,
      userId: userId,
      accept: accept
    };
    return this.http.put(`${this.baseUrl}/invitations/respond`, body);
  }

  getTripsByUserId(userId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/user/${userId}`);
  }

  addVisitedPlace(place: any): Observable<any> {
    return this.http.post('http://localhost:8080/places', place);
  }

  getVisitedPlaces(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/places/user/${userId}`);
  }

  // ==========================================
  // CHAT GRUPAL
  // ==========================================

  sendTripMessage(tripId: number, userId: number, content: string): Observable<any> {
    const body = { userId, content };
    return this.http.post(`${this.baseUrl}/${tripId}/messages`, body);
  }

  getTripMessages(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${tripId}/messages`);
  }

  // ==========================================
  // PAGOS
  // ==========================================

  markAsPaid(expenseId: number, userId: number, isPaid: boolean): Observable<any> {
    return this.http.put(`${this.baseUrl}/expenses/pay`, { expenseId, userId, isPaid });
  }
}