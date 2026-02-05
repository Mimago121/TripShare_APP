import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../interfaces/models/trip.model';
import { CreateTripRequest } from '../interfaces/api/create-trip.request';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = '/api/trips'; // proxy -> localhost:8080

  constructor(private http: HttpClient) {}

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  createTrip(dto: CreateTripRequest): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, dto);
  }

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
