/*import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
 
  private auth: Auth = inject(Auth);

  // --- ESTA ES LA LÍNEA QUE FALTABA ---
  // Es un "Observable" (una antena) que emite el usuario cuando se conecta
  // y emite 'null' cuando se desconecta.
  readonly user$: Observable<User | null> = authState(this.auth);


  // Métodos que ya tenías:
  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  register(email: string, pass: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass);
  }

  logout() {
    return signOut(this.auth);
  }
}*/
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Simulamos un usuario activo para que la App no nos mande a Login
  private userSubject = new BehaviorSubject<any>({ userName: 'Admin de Pruebas', id: 1 });
  readonly user$ = this.userSubject.asObservable();

  // Siempre devolvemos true para que los Guards nos dejen pasar
  isLoggedIn(): boolean {
    return true; 
  }

  login(email: string, pass: string) {
    return of(true); // Siempre loguea bien
  }

  logout() {
    console.log('Logout simulado');
  }
  // Añade esto dentro de la clase AuthService
async register(email: string, pass: string) {
  console.log('Registro simulado para:', email);
  return { user: { email: email } }; // Devolvemos un objeto falso para que no de error
}
}