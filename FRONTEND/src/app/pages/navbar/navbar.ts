import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';

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
  isNotificationsOpen: boolean = false;

  userAvatar: string = '';
  userName: string = '';
  currentUserId: number = 0;

  notificationCount: number = 0;
  pendingRequests: any[] = [];

  constructor(
    private router: Router, 
    public themeService: ThemeService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    if (this.isLoggedIn) {
      this.loadNotifications();
    }
  }

  checkLoginStatus() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.isLoggedIn = true;
        const user = JSON.parse(userStr);
        this.currentUserId = user.id;
        this.userAvatar = user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        this.userName = user.userName || 'Usuario';
      }
    }
  }

  loadNotifications() {
    console.log('Cargando notificaciones para usuario:', this.currentUserId);
    this.userService.getMyNotifications(this.currentUserId).subscribe({
      next: (requests) => {
        console.log('DATOS RECIBIDOS DEL BACKEND:', requests); // <--- MIRA ESTO EN CONSOLA
        this.pendingRequests = requests || [];
        this.notificationCount = this.pendingRequests.length;
      },
      error: (err) => console.error('Error al cargar notificaciones:', err)
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) this.isNotificationsOpen = false;
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) this.isDropdownOpen = false;
  }

  closeAllMenus() {
    this.isDropdownOpen = false;
    this.isNotificationsOpen = false;
  }

  acceptRequest(reqId: number) {
    console.log('Intentando aceptar ID:', reqId); // <--- DEBUG CLICK
    
    if (!reqId) {
      console.error('ERROR: El ID es inválido o undefined');
      return;
    }

    this.userService.acceptFriendRequest(reqId).subscribe({
      next: () => {
        console.log('Solicitud aceptada correctamente');
        // Filtramos la lista para quitar la aceptada
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId);
        this.notificationCount = this.pendingRequests.length;
      },
      error: (e) => console.error('Error al aceptar:', e)
    });
  }

  rejectRequest(reqId: number) {
    console.log('Intentando rechazar ID:', reqId); // <--- DEBUG CLICK
    
    if (!reqId) return;

    this.userService.rejectFriendRequest(reqId).subscribe({
      next: () => {
        console.log('Solicitud rechazada correctamente');
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId);
        this.notificationCount = this.pendingRequests.length;
      },
      error: (e) => console.error('Error al rechazar:', e)
    });
  }

  logout() {
    this.closeAllMenus();
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}