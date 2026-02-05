import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/User';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Usamos la ruta que configuramos en el Routing de Ktor
  private apiUrl = 'http://localhost:8080/api/users'; 

  constructor(private http: HttpClient) { }

  // GET: Obtener todos
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // POST: Crear uno nuevo
  createUser(user: User): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }
}