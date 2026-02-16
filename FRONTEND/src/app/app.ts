import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './pages/navbar/navbar';
import { FooterComponent } from './pages/footer/footer';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './pages/login/login';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  public router = inject(Router);
  

  shouldShowMenu(): boolean {
    const currentUrl = this.router.url;

    // Lista de rutas donde NO queremos ver el menú (Login, Registro y Raíz)
    const hiddenRoutes = ['/login', '/register', '/'];

    // Si la URL actual está en la lista de ocultas, devolvemos false (no mostrar)
    // Si NO está en la lista, devolvemos true (mostrar)
    return !hiddenRoutes.includes(currentUrl);
  }

  
  
}
