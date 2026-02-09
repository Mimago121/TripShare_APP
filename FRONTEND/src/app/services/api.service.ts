import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string) {
    return this.http.get<T>(this.baseUrl + path, {
      headers: this.buildHeaders(),
    });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(this.baseUrl + path, body, {
      headers: this.buildHeaders(),
    });
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(this.baseUrl + path, body, {
      headers: this.buildHeaders(),
    });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(this.baseUrl + path, {
      headers: this.buildHeaders(),
    });
  }

  private buildHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
