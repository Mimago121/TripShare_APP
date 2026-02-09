import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: number;
  fromId: number;
  toId: number;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface ChatNotification {
  fromUserId: number;
  fromUserName: string;
  fromUserAvatar: string;
  count: number;
}
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8080/chat';

  constructor(private http: HttpClient) {}

  getConversation(myId: number, friendId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/${myId}/${friendId}`);
  }

  sendMessage(fromId: number, toId: number, content: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/send`, 
      { fromId, toId, content }, 
      { responseType: 'text' as 'json' } // <--- AÑADE ESTA LÍNEA
    ); 
  }

  // 👇 OBTENER NOTIFICACIONES
  getUnreadNotifications(myId: number): Observable<ChatNotification[]> {
    return this.http.get<ChatNotification[]>(`${this.baseUrl}/notifications/${myId}`);
  }

  // 👇 MARCAR COMO LEÍDO
  markAsRead(myId: number, friendId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/read/${myId}/${friendId}`, {}, { responseType: 'text' as 'json' });
  }
}