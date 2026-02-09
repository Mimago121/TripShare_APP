import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // CAMBIO IMPORTANTE: Apuntamos a la raíz, no a /users
  // Así podemos acceder a /users y a /friends sin conflictos
  private baseUrl = 'http://localhost:8080'; 

  constructor(private http: HttpClient) { }

  // ==========================================
  // 1. GESTIÓN DE USUARIOS (/users)
  // ==========================================

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, data); 
  }

  // ==========================================
  // 2. GESTIÓN DE AMIGOS (/friends) - ¡REAL!
  // ==========================================
  
  // Enviar solicitud (POST /friends/request)
  // Nota: Ahora recibimos IDs numéricos, que es lo que espera el Backend
  sendFriendRequest(fromUserId: number, toUserId: number): Observable<any> {
    const body = {
      fromId: fromUserId,
      toId: toUserId
    };
    return this.http.post(`${this.baseUrl}/friends/request`, body);
  }

  // Obtener mis notificaciones (GET /friends/pending/{id})
  getMyNotifications(myUserId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/friends/pending/${myUserId}`);
  }

  // Aceptar solicitud (PUT /friends/accept/{id})
  acceptFriendRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/friends/accept/${requestId}`, {});
  }

  // Rechazar solicitud (DELETE /friends/reject/{id})
  rejectFriendRequest(requestId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/friends/reject/${requestId}`);
  }

  // Obtener mis amigos confirmados
  getMyFriends(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/friends/accepted/${userId}`);
  }
}