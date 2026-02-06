import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 1. Creamos el user$ que todos los componentes buscan
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, pass: string) {
  return this.http.post('http://localhost:8080/login', { email, pass });
}

  // 2. Añadimos el logout que pide el Navbar y Profile
  async logout() {
    this.userSubject.next(null);
    console.log('Sesión cerrada');
  }

  register(userName: string, email: string, pass: string): Observable<any> {
  // Enviamos los datos al puerto 8080 del Ktor
  return this.http.post('http://localhost:8080/register', { userName, email, pass });
}
}