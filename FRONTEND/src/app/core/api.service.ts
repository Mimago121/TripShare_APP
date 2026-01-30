import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PingResponse {
  ok: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  ping() {
    return this.http.get<PingResponse>('/api/ping');
  }
}
