import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Usamos la ruta que configuramos en el Routing de Ktor
  private apiUrl = 'http://localhost:8080/users'; 

  constructor(private http: HttpClient) { }

  // GET: Obtener todos
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}