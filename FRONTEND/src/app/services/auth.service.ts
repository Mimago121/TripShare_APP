import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 1. Creamos el user$ que todos los componentes buscan
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Simulamos que hay un usuario logueado para que no veas todo vacío
    this.userSubject.next({ email: 'test@test.com', displayName: 'Usuario Prueba', photoURL: '' });
  }

  login(email: string, pass: string): Observable<any> {
    const mockUser = { email: email, displayName: 'Sergi', photoURL: '' };
    this.userSubject.next(mockUser); // Notificamos a toda la app
    return of(mockUser);
  }

  // 2. Añadimos el logout que pide el Navbar y Profile
  async logout() {
    this.userSubject.next(null);
    console.log('Sesión cerrada');
  }

  // 3. Ajustamos el register para que acepte los argumentos que envías
  register(email: string, pass: string): Observable<any> {
    const newUser = { user: { email: email } };
    return of(newUser);
  }
}