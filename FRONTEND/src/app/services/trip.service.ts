import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Trip } from '../interfaces/models/trip.model';
import { TripResponse } from '../interfaces/api/trips.api';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = '/api/trips';

  constructor(private http: HttpClient) {}

  // API -> UI
  private toTrip(api: TripResponse): Trip {
    return {
      id: api.id,
      name: api.name,
      origin: api.origin,
      destination: api.destination,
      startDate: api.startDate,
      endDate: api.endDate,
      members: [] // el backend no manda miembros (de momento)
    };
  }

  getTrips(): Observable<Trip[]> {
    return this.http.get<TripResponse[]>(this.apiUrl).pipe(
      map(apiTrips => apiTrips.map(t => this.toTrip(t)))
    );
  }

  getTripById(id: number): Observable<Trip> {
    return this.http.get<TripResponse>(`${this.apiUrl}/${id}`).pipe(
      map(apiTrip => this.toTrip(apiTrip))
    );
  }

  // OJO: el backend espera createdByUserId y NO espera imageUrl (según tu DTO Kotlin)
  // hay que añadir imageUrl al DTO de kotlin tripResponse y CreateTripRequest
  createTrip(
    name: string,
    origin: string | null,
    destination: string,
    startDate: string,
    endDate: string,
    createdByUserId: number
  ): Observable<Trip> {
    const body = { name, origin, destination, startDate, endDate, createdByUserId };
    return this.http.post<TripResponse>(this.apiUrl, body).pipe(
      map(apiTrip => this.toTrip(apiTrip))
    );
  }

  updateTrip(
    id: number,
    data: {
      name?: string;
      origin?: string | null;
      destination?: string;
      startDate?: string;
      endDate?: string;
      // si el backend permite, podrías añadir createdByUserId, pero normalmente NO se actualiza
    }
  ): Observable<Trip> {
    return this.http.put<TripResponse>(`${this.apiUrl}/${id}`, data).pipe(
      map(apiTrip => this.toTrip(apiTrip))
    );
  }

  // ⚠️ Solo funcionará si el backend tiene este endpoint y devuelve TripResponse
  updateTripImage(id: number, imageUrl: string | null): Observable<Trip> {
    return this.http.patch<TripResponse>(`${this.apiUrl}/${id}/image`, { imageUrl }).pipe(
      map(apiTrip => this.toTrip(apiTrip))
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

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
