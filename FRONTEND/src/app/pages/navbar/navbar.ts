import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  isDropdownOpen: boolean = false;
  notificationsEnabled: boolean = true; // Nueva variable para notificaciones
  
  userAvatar: string = '';
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.isLoggedIn = true;
      const user = JSON.parse(userStr);
      this.userAvatar = user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      this.userName = user.userName || 'Usuario';
    } else {
      this.isLoggedIn = false;
    }
  }

  // --- LÓGICA DEL DESPLEGABLE ---
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  // --- LÓGICA DE NOTIFICACIONES ---
  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    
    // Mostramos un mensaje simple (puedes cambiarlo por algo más visual luego)
    if (this.notificationsEnabled) {
      alert('🔔 ¡Notificaciones ACTIVADAS!');
    } else {
      alert('🔕 Notificaciones DESACTIVADAS');
    }
  }

  logout() {
    this.closeDropdown();
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }
}