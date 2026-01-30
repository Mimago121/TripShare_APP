import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PingResponse {
  ok: boolean;
  message: string;
}

export interface TripDto {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  ping() {
    return this.http.get<PingResponse>('/api/ping');
  }

  getTrips() {
    return this.http.get<TripDto[]>('/api/trips');
  }
}
