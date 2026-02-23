import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { ChatService, ChatNotification } from '../../services/chat.service';
import { TripService, Trip } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  currentUserId: number = 0;
  userName: string = '';
  userAvatar: string = '';

  isDropdownOpen: boolean = false;
  isNotificationsOpen: boolean = false;
  showLogoutModal: boolean = false; 

  pendingRequests: any[] = [];
  chatNotifications: ChatNotification[] = [];
  tripInvitations: Trip[] = [];

  private intervalId: any;

  constructor(
    private router: Router, 
    public themeService: ThemeService,
    private userService: UserService,
    private chatService: ChatService,
    private tripService: TripService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkLoginStatus();

    if (this.isLoggedIn && !this.isAdmin) {
      this.refreshAllNotifications();
      
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
        this.isAdmin = user.role === 'admin';
      }
    }
  }

  refreshAllNotifications() {
    if (!this.currentUserId || this.isAdmin) return;
    this.loadFriendRequests();
    this.loadChatNotifications();
    this.loadTripInvitations();
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
    if (this.isAdmin) return 0;
    return this.pendingRequests.length + this.chatNotifications.length + this.tripInvitations.length;
  }

  acceptRequest(reqId: number) {
    this.userService.acceptFriendRequest(reqId).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId),
      error: (e) => console.error('Error al aceptar amigo:', e)
    });
  }

  rejectRequest(reqId: number) {
    this.userService.rejectFriendRequest(reqId).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId),
      error: (e) => console.error('Error al rechazar amigo:', e)
    });
  }

  respondToTrip(tripId: number | undefined, accept: boolean) {
    if (!tripId) return;
    this.tripService.respondToInvitation(tripId, this.currentUserId, accept).subscribe({
      next: () => {
        this.tripInvitations = this.tripInvitations.filter(t => t.id !== tripId);
        if (accept) {
          this.closeAllMenus();
          this.router.navigate(['/trip-detail', tripId]);
        }
      },
      error: (e) => console.error('Error al responder viaje:', e)
    });
  }

  openChatFromNotification(notification: ChatNotification) {
    this.chatService.markAsRead(this.currentUserId, notification.fromUserId).subscribe({
      next: () => this.chatNotifications = this.chatNotifications.filter(n => n.fromUserId !== notification.fromUserId),
      error: () => {}
    });
    this.closeAllMenus();
    this.router.navigate(['/friends'], { queryParams: { chatWith: notification.fromUserId } });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) this.isNotificationsOpen = false;
  }

  toggleNotifications() {
    if (this.isAdmin) return;
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) this.isDropdownOpen = false;
  }

  closeAllMenus() {
    this.isDropdownOpen = false;
    this.isNotificationsOpen = false;
  }

  openLogoutModal() {
    this.closeAllMenus();
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.authService.logout().subscribe({
      next: () => {
        this.showLogoutModal = false;
        localStorage.removeItem('user');
        this.isLoggedIn = false;
        this.isAdmin = false;
        this.router.navigate(['/home']).then(() => window.location.reload());
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
        this.showLogoutModal = false;
        localStorage.removeItem('user');
        this.isLoggedIn = false;
        this.isAdmin = false;
        this.router.navigate(['/home']).then(() => window.location.reload());
      }
    });
  }
}