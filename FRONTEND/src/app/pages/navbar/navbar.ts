import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Ajusta la ruta a tu servicio

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  isMenuOpen = false; // Para móvil si lo necesitaras

  constructor(private auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout(); // Asegúrate de tener este método en tu servicio
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}