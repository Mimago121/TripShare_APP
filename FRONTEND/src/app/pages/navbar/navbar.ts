import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { ChatService, ChatNotification } from '../../services/chat.service';
import { TripService, Trip } from '../../services/trip.service'; // Inyectado

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

  // Notificaciones
  pendingRequests: any[] = [];
  chatNotifications: ChatNotification[] = [];
  tripInvitations: Trip[] = []; // NUEVA VARIABLE

  // Control del intervalo
  private intervalId: any;

  constructor(
    private router: Router, 
    public themeService: ThemeService,
    private userService: UserService,
    private chatService: ChatService,
    private tripService: TripService // NUEVO
  ) {}

  ngOnInit() {
    this.checkLoginStatus();

    if (this.isLoggedIn) {
      this.refreshAllNotifications();
      // Actualización cada 3 segundos
      this.intervalId = setInterval(() => {
        this.refreshAllNotifications();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

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
    this.loadTripInvitations(); // NUEVA LLAMADA
  }

  loadFriendRequests() {
    this.userService.getMyNotifications(this.currentUserId).subscribe({
      next: (requests) => this.pendingRequests = requests || [],
      error: () => {}
    });
  }

  loadChatNotifications() {
    this.chatService.getUnreadNotifications(this.currentUserId).subscribe({
      next: (notifs) => this.chatNotifications = notifs || [],
      error: () => {}
    });
  }

  loadTripInvitations() {
    this.tripService.getInvitations(this.currentUserId).subscribe({
      next: (invites) => this.tripInvitations = invites || [],
      error: () => {}
    });
  }

  get totalNotificationsCount(): number {
    return this.pendingRequests.length + this.chatNotifications.length + this.tripInvitations.length;
  }

  // ACCIONES DE AMISTAD
  acceptRequest(reqId: number) {
    this.userService.acceptFriendRequest(reqId).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId),
      error: (e) => console.error('Error al aceptar:', e)
    });
  }

  rejectRequest(reqId: number) {
    this.userService.rejectFriendRequest(reqId).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId),
      error: (e) => console.error('Error al rechazar:', e)
    });
  }

  // ACCIONES DE VIAJE (Miriam acepta/rechaza)
respondToTrip(tripId: number | undefined, accept: boolean) {
  if (!tripId) {
    console.error("ID de viaje no encontrado");
    return;
  }

  this.tripService.respondToInvitation(tripId, this.currentUserId, accept).subscribe({
    next: () => {
      this.tripInvitations = this.tripInvitations.filter(t => t.id !== tripId);
      if (accept) {
        this.closeAllMenus();
        this.router.navigate(['/trip-detail', tripId]);
      }
    },
    error: (e) => console.error('Error al responder invitación de viaje:', e)
  });
}

  // MENÚS
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
    if (this.intervalId) clearInterval(this.intervalId);
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  openChatFromNotification(notification: ChatNotification) {
    this.chatService.markAsRead(this.currentUserId, notification.fromUserId).subscribe({
      next: () => this.chatNotifications = this.chatNotifications.filter(n => n.fromUserId !== notification.fromUserId),
      error: () => {}
    });
    this.closeAllMenus();
    this.router.navigate(['/friends'], { queryParams: { chatWith: notification.fromUserId } });
  }
}