import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../interfaces/models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = '/api/trips'; // proxy -> localhost:8080

  constructor(private http: HttpClient) {}

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  /** Obtener un viaje por id (detalle) */
  getTripById(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  //solo mandamos lo esencial que rellena el usuario
  createTrip(
    name: string,
    origin: string | null,
    destination: string,
    startDate: string,
    endDate: string,
    imageUrl?: string | null
  ): Observable<Trip> {
    const body = { name, origin, destination, startDate, endDate, imageUrl: imageUrl ?? null };
    return this.http.post<Trip>(this.apiUrl, body);
  }

  //para llamar en componentes:
//   this.tripService.createTrip(
//   v.name.trim(),
//   v.origin?.trim() ?? null,
//   v.destination.trim(),
//   v.startDate,
//   v.endDate,
//   v.imageUrl?.trim() ?? null
// ).subscribe(...)

/** Actualizar datos básicos del viaje (nombre, fechas, origen/destino) */
  updateTrip(
    id: number,
    data: {
      name?: string;
      origin?: string | null;
      destination?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}`, data);
  }

  /** Actualizar SOLO la imagen del viaje */
  updateTripImage(id: number, imageUrl: string | null): Observable<Trip> {
    return this.http.patch<Trip>(`${this.apiUrl}/${id}/image`, {
      imageUrl,
    });
  }

  /** Invitar a un usuario por email */
  inviteMember(tripId: number, email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites`, { email });
  }

  /** Aceptar invitación */
  acceptInvite(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites/accept`, {});
  }

  /** Rechazar invitación */
  rejectInvite(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/invites/reject`, {});
  }

  /** Salir de un viaje */
  leaveTrip(tripId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tripId}/leave`, {});
  }


  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
