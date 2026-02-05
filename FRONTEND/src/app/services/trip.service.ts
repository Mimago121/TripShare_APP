import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../interfaces/Trip';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);
  
  // Esta URL debe coincidir con la que definimos en Routing.kt de tu Backend
  private apiUrl = 'http://localhost:8080/api/trips'; 

  // Obtener todos los viajes
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  // Crear un nuevo viaje (POST)
  createTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, trip);
  }

  // Eliminar un viaje
  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}