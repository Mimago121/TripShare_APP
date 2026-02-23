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
  
  logout(): Observable<any> {
  // 1. Limpiamos el estado local en Angular (lo que ya tenías)
  this.userSubject.next(null);
  console.log('Sesión cerrada localmente');

  // 2. Avisamos al servidor Ktor para que destruya la cookie de seguridad
  // IMPORTANTE: Ponemos el "return" para que el Navbar pueda hacer el .subscribe()
  return this.http.post('http://localhost:8080/logout', {});
}
  register(userName: string, email: string, pass: string): Observable<any> {
  // Enviamos los datos al puerto 8080 del Ktor
  return this.http.post('http://localhost:8080/register', { userName, email, pass });
}
}