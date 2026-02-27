import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { ChatService, ChatNotification } from '../../services/chat.service';
import { TripService, Trip } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

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

  // 🔥 LA MAGIA: Guardamos la "foto" exacta de las notificaciones que ya hemos clicado
  private static acknowledgedChats: Map<number, string> = new Map();
  
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

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.refreshAllNotifications();
    });

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
      next: (notifs) => {
        const incoming = notifs || [];
        
        this.chatNotifications = incoming.filter(n => {
          // 1. Si estás dentro del chat con esa persona, NO molestamos con el "1"
          if (this.router.url.includes(`chatWith=${n.fromUserId}`)) return false;

          // 2. Comprobamos si es una notificación vieja que ya habíamos clicado
          const notifString = JSON.stringify(n);
          if (NavbarComponent.acknowledgedChats.get(n.fromUserId) === notifString) {
            // El servidor nos manda exactamente lo mismo que ya cerramos. Lo ocultamos.
            return false;
          }

          // Si es un mensaje realmente nuevo (o no lo habíamos visto), lo mostramos.
          return true;
        });
      },
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
    this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId); 
    this.userService.acceptFriendRequest(reqId).subscribe({ error: (e) => console.error(e) });
  }

  rejectRequest(reqId: number) {
    this.pendingRequests = this.pendingRequests.filter(req => req.id !== reqId); 
    this.userService.rejectFriendRequest(reqId).subscribe({ error: (e) => console.error(e) });
  }

  respondToTrip(tripId: number | undefined, accept: boolean) {
    if (!tripId) return;
    this.tripInvitations = this.tripInvitations.filter(t => t.id !== tripId); 
    
    this.tripService.respondToInvitation(tripId, this.currentUserId, accept).subscribe({
      next: () => {
        if (accept) {
          this.closeAllMenus();
          this.router.navigate(['/trip-detail', tripId]);
        }
      },
      error: (e) => console.error(e)
    });
  }

  openChatFromNotification(notification: ChatNotification) {
    // 1. Le hacemos la "foto" a ESTA notificación exacta y la guardamos
    NavbarComponent.acknowledgedChats.set(notification.fromUserId, JSON.stringify(notification));

    // 2. La borramos de la vista de inmediato para que desaparezca el "1"
    this.chatNotifications = this.chatNotifications.filter(n => n.fromUserId !== notification.fromUserId);

    // 3. Avisamos al backend
    this.chatService.markAsRead(this.currentUserId, notification.fromUserId).subscribe({
      next: () => {},
      error: (err) => console.error("Error al marcar leído", err)
    });

    // 4. Vamos a la pantalla de chat
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
    if (this.intervalId) clearInterval(this.intervalId);
    
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