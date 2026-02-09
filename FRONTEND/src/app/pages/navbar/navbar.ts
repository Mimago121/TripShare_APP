import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { ChatService, ChatNotification } from '../../services/chat.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Estado
  isLoggedIn: boolean = false;
  isDropdownOpen: boolean = false;
  isNotificationsOpen: boolean = false;

  // Datos Usuario
  userAvatar: string = '';
  userName: string = '';
  currentUserId: number = 0;

  // Notificaciones de AMISTAD
  pendingRequests: any[] = [];
  
  // Notificaciones de CHAT
  chatNotifications: ChatNotification[] = [];

  // Control del intervalo
  private intervalId: any;

  constructor(
    private router: Router, 
    public themeService: ThemeService,
    private userService: UserService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.checkLoginStatus();

    if (this.isLoggedIn) {
      // 1. Carga inicial inmediata
      this.refreshAllNotifications();

      // 2. Configurar actualización cada 3 segundos (Polling)
      this.intervalId = setInterval(() => {
        this.refreshAllNotifications();
      }, 3000);
    }
  }

  ngOnDestroy() {
    // IMPORTANTE: Limpiar intervalo al salir para evitar fugas de memoria
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ==========================================
  // LOGICA DE DATOS
  // ==========================================

  checkLoginStatus() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.isLoggedIn = true;
        this.currentUserId = user.id;
        this.userName = user.userName || 'Usuario';
        this.userAvatar = user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      }
    }
  }

  refreshAllNotifications() {
    if (!this.currentUserId) return;
    this.loadFriendRequests();
    this.loadChatNotifications();
  }

  // Cargar Solicitudes de Amistad
  loadFriendRequests() {
    this.userService.getMyNotifications(this.currentUserId).subscribe({
      next: (requests) => {
        this.pendingRequests = requests || [];
      },
      error: () => {} // Silencioso para no ensuciar consola
    });
  }

  // Cargar Mensajes no leídos
  loadChatNotifications() {
    this.chatService.getUnreadNotifications(this.currentUserId).subscribe({
      next: (notifs) => {
        this.chatNotifications = notifs || [];
      },
      error: () => {}
    });
  }

  // Getter para saber el total de globos rojos (Amigos + Chat)
  get totalNotificationsCount(): number {
    return this.pendingRequests.length + this.chatNotifications.length;
  }

  // ==========================================
  // ACCIONES DE AMISTAD
  // ==========================================

  acceptRequest(reqId: number) {
    if (!reqId) return;
    this.userService.acceptFriendRequest(reqId).subscribe({
      next: () => {
        // Actualizamos la lista localmente para que sea rápido
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId);
      },
      error: (e) => console.error('Error al aceptar:', e)
    });
  }

  rejectRequest(reqId: number) {
    if (!reqId) return;
    this.userService.rejectFriendRequest(reqId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId);
      },
      error: (e) => console.error('Error al rechazar:', e)
    });
  }

  // ==========================================
  // MENÚS Y NAVEGACIÓN
  // ==========================================

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

  logout() {
    this.closeAllMenus();
    if (this.intervalId) clearInterval(this.intervalId); // Parar polling
    
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  openChatFromNotification(notification: ChatNotification) {
    if (!this.currentUserId) return;

    // 1. Marcar como leído y limpiar lista (Visual)
    this.chatService.markAsRead(this.currentUserId, notification.fromUserId).subscribe({
      next: () => {
        this.chatNotifications = this.chatNotifications.filter(
          n => n.fromUserId !== notification.fromUserId
        );
      },
      error: () => {}
    });

    this.closeAllMenus();

    // 2. NAVEGAR A AMIGOS CON EL PARÁMETRO 'chatWith'
    this.router.navigate(['/friends'], { 
      queryParams: { chatWith: notification.fromUserId } 
    });
  }
}