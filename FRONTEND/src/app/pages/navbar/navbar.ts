import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
// IMPORTANTE: NUNCA pongas .ts aquí, Angular se rompe
import { ThemeService } from '../../services/theme.service'; 

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
  userAvatar: string = '';
  userName: string = '';

  constructor(private router: Router, public themeService: ThemeService) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    // Evitamos error si no hay localStorage (SSR)
    if (typeof localStorage !== 'undefined') {
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
  }

  toggleDropdown() {
    console.log('Click en Avatar detectado'); // Mira la consola (F12)
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
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