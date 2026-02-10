import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Trip } from '../interfaces/models/trip.model';
import { TripResponse } from '../interfaces/api/trips.api';

export interface CreateTripRequest {
  name: string;
  destination: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  origin?: string | null;
  // createdByUserId?: number; // mejor que el backend lo saque del token en el futuro
}

export interface UpdateTripRequest {
  name?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  origin?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = '/trips';

  constructor(private http: HttpClient) {}

  // API -> UI
  private toTrip(api: TripResponse): Trip {
    return {
      id: api.id,
      name: api.name,
      origin: (api as any).origin ?? null, // por si todavía no viene siempre
      destination: api.destination,
      startDate: api.startDate,
      endDate: api.endDate,
      members: [] // backend aún no manda miembros
    };
  }

  getTrips(): Observable<Trip[]> {
    return this.http.get<TripResponse[]>(this.apiUrl).pipe(
      map(list => (list ?? []).map(t => this.toTrip(t)))
    );
  }

  getTripById(id: number): Observable<Trip> {
    return this.http.get<TripResponse>(`${this.apiUrl}/${id}`).pipe(
      map(t => this.toTrip(t))
    );
  }

  /**
   * ✅ Importante: recibe un objeto (dto)
   * Así encaja con el componente: this.tripService.createTrip(dto)
   */
  createTrip(dto: CreateTripRequest): Observable<Trip> {
    return this.http.post<TripResponse>(this.apiUrl, dto).pipe(
      map(t => this.toTrip(t))
    );
  }

  updateTrip(id: number, dto: UpdateTripRequest): Observable<Trip> {
    return this.http.put<TripResponse>(`${this.apiUrl}/${id}`, dto).pipe(
      map(t => this.toTrip(t))
    );
  }

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // -----------------------------
  // Endpoints "extra" (solo si existen en backend)
  // -----------------------------

  updateTripImage(id: number, imageUrl: string | null): Observable<Trip> {
    return this.http.patch<TripResponse>(`${this.apiUrl}/${id}/image`, { imageUrl }).pipe(
      map(t => this.toTrip(t))
    );
  }

  inviteMember(tripId: number, email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites`, { email });
  }

  acceptInvite(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites/accept`, {});
  }

  rejectInvite(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites/reject`, {});
  }

  leaveTrip(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/leave`, {});
  }
}
