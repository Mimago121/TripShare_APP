import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip, Member } from '../../services/trip.service';
import { GoogleMapsModule, MapGeocoder } from '@angular/google-maps';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, FormsModule, GoogleMapsModule],
  templateUrl: './trip-detail.html',
  styleUrls: ['./trip-detail.css']
})
export class TripDetailComponent implements OnInit {
  trip: Trip | null = null;
  tripImageUrl: string = ''; 
  activities: any[] = [];
  todayActivities: any[] = []; 
  expenses: any[] = [];
  memories: any[] = [];
  members: any[] = []; 
  myFriends: Member[] = []; 
  availableFriends: Member[] = []; 
  
  memberToDelete: Member | null = null;
  leaveModalMessage: string = ''; 

  tripDays: { date: string, dateObj: Date, activities: any[] }[] = [];
  hours: string[] = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
  todayString: string = new Date().toISOString().split('T')[0];
  currentTimePx: string = '0px';
  chatMessages: any[] = [];
  newMessageText: string = '';

  tripId!: number;
  currentUserId: number | null = null;
  activeTab: string = 'itinerary';
  isLoading: boolean = true;
  totalExpenses: number = 0;

  showModal: boolean = false;
  modalType: string = ''; 
  errorMessage: string = ''; 
  successMessage: string = ''; 
  
  emailInviteInput: string = '';

  newActivity = { title: '', startTime: '10:00', endTime: '', location: '', imageUrl: '', selectedDate: '' };
  minTripDate: string = '';
  maxTripDate: string = '';
  newExpense = { description: '', amount: 1 }; 
  newMemory = { type: 'photo', description: '', url: '' };

  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  markerPosition: google.maps.LatLngLiteral | undefined;
  mapCenter: google.maps.LatLngLiteral = { lat: 40.416, lng: -3.703 };
  showMap: boolean = false;
  directionsResult: google.maps.DirectionsResult | undefined;
  activityMarkers: google.maps.LatLngLiteral[] = [];

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private geocoder: MapGeocoder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) this.currentUserId = JSON.parse(userStr).id;
    }

    this.route.params.subscribe(params => {
      this.tripId = Number(params['id']);
      if (this.tripId) {
        this.loadTripData();
        this.loadFriends();
      }
    });

    const now = new Date();
    this.currentTimePx = `${(now.getHours() * 60) + now.getMinutes()}px`;
  }

  @ViewChild('locationInput') set locationInput(el: ElementRef) {
    if (el && typeof google !== 'undefined' && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(el.nativeElement, {
        fields: ['formatted_address', 'name']
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          this.newActivity.location = place.formatted_address || place.name || '';
        });
      });
    }
  }

  get isOwner(): boolean {
    if (!this.trip || !this.currentUserId) return false;
    return this.trip.createdByUserId === this.currentUserId;
  }

  get displayedMembers() { 
    return this.members.filter(m => m.status !== 'pending').slice(0, 3); 
  }
  
  get remainingMembersCount() { 
    const activeCount = this.members.filter(m => m.status !== 'pending').length;
    return activeCount > 3 ? activeCount - 3 : 0; 
  }

  loadTripData() {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (data) => {
        this.trip = data;
        this.tripImageUrl = (data as any).imageUrl || ''; 
        
        if (this.trip) {
          this.minTripDate = this.formatDateForInput(this.trip.startDate);
          this.maxTripDate = this.formatDateForInput(this.trip.endDate, true);
          if (this.trip.destination) this.cargarUbicacion(this.trip.destination);
          this.generateTripDays();
        }

        this.tripService.getActivities(this.tripId).subscribe(a => {
          this.activities = a.map((act: any) => {
            if (act.title && act.title.includes('||LOC||')) {
              const parts = act.title.split('||LOC||');
              act.title = parts[0].trim();
              let locAndImg = parts[1].trim();
              
              if (locAndImg.includes('||IMG||')) {
                const subParts = locAndImg.split('||IMG||');
                act.location = subParts[0].trim();
                act.imageUrl = subParts[1].trim(); 
              } else {
                act.location = locAndImg;
              }
            }
            return act;
          });
          
          this.groupActivitiesByDay(); 
          this.filterTodayActivities(); 
          this.updateMapRoute(); 
        });
        
        // ORDEN CORREGIDO: PRIMERO MIEMBROS, LUEGO GASTOS
        this.tripService.getMembers(this.tripId).subscribe(mem => {
          this.members = this.sortMembersList(mem);
          
          this.tripService.getExpenses(this.tripId).subscribe(e => {
            this.expenses = e.map((expense: any) => {
              const activeMembers = this.members.filter(m => m.status !== 'pending');
              
              // TRUCO FRONTEND: Si el backend no devuelve divisiones, las calculamos automáticamente
              if (!expense.splits || expense.splits.length === 0) {
                if (activeMembers.length > 1) {
                  // Dividimos el total entre todos los miembros activos
                  const splitAmount = +(expense.amount / activeMembers.length).toFixed(2);
                  
                  expense.splits = activeMembers
                    .filter(m => m.id !== expense.paidByUserId) // El que paga no se debe a sí mismo
                    .map(m => ({
                      userId: m.id,
                      userName: m.userName,
                      amount: splitAmount,
                      isPaid: false
                    }));
                } else {
                  expense.splits = [];
                }
              } else {
                // Si el backend sí las envía, nos aseguramos de limpiarlas
                expense.splits = expense.splits.filter((split: any) => {
                  return activeMembers.find(m => m.id === split.userId);
                });
              }

              // Nos aseguramos de que salga el nombre de quién pagó
              if (!expense.paidByUserName) {
                const payer = this.members.find(m => m.id === expense.paidByUserId);
                expense.paidByUserName = payer ? payer.userName : 'Alguien';
              }

              return expense;
            });
            this.calculateTotal();
          });
        });
        
        this.loadMemories();
        this.loadChat();
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterTodayActivities() {
    const todayStr = new Date().toISOString().split('T')[0]; 
    
    this.todayActivities = this.activities.filter(act => {
      const actDateStr = act.startDatetime.split('T')[0];
      return actDateStr === todayStr;
    });

    this.todayActivities.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
  }

  private sortMembersList(membersList: any[]): any[] {
    return membersList.sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        
        const isAPending = a.status === 'pending';
        const isBPending = b.status === 'pending';

        if (!isAPending && isBPending) return -1;
        if (isAPending && !isBPending) return 1;

        return a.userName.localeCompare(b.userName);
    });
  }

  openDeleteModal(member: Member) {
    if (!this.isOwner) return;
    this.memberToDelete = member;
    this.errorMessage = '';
    this.modalType = 'delete-member'; 
    this.showModal = true;
  }

  confirmDeleteMember() {
    if (!this.memberToDelete) return;

    this.tripService.removeMember(this.tripId, this.memberToDelete.id).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.id !== this.memberToDelete!.id);
        this.loadFriends(); 
        this.closeModal();
      },
      error: (err) => {
        console.error("Error eliminando miembro", err);
        this.errorMessage = "Hubo un error al eliminar al usuario. Inténtalo de nuevo.";
      }
    });
  }

  openLeaveModal() {
    this.modalType = 'leave-trip';
    this.errorMessage = '';
    
    if (this.isOwner) {
      if (this.members.length > 1) {
        this.leaveModalMessage = "Al ser el organizador, si sales, se asignará automáticamente un nuevo administrador entre los miembros restantes.";
      } else {
        this.leaveModalMessage = "Eres el único miembro. Si sales, el viaje se eliminará permanentemente.";
      }
    } else {
      this.leaveModalMessage = "¿Estás seguro de que quieres abandonar el grupo? Tendrán que volverte a invitar si quieres regresar.";
    }

    this.showModal = true;
  }

  confirmLeaveTrip() {
    if (!this.currentUserId) return;

    this.tripService.removeMember(this.tripId, this.currentUserId).subscribe({
      next: () => {
        this.closeModal();
        this.router.navigate(['/trips']);
      },
      error: (err) => {
        console.error("Error del backend al salir del viaje:", err);
        this.errorMessage = "El servidor rechazó la petición. Revisa la consola (F12).";
      }
    });
  }

  generateTripDays() {
    if (!this.trip) return;
    const start = new Date(this.trip.startDate);
    const end = new Date(this.trip.endDate);
    this.tripDays = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        this.tripDays.push({
            date: d.toISOString().split('T')[0],
            dateObj: new Date(d),
            activities: []
        });
    }
  }

  groupActivitiesByDay() {
    this.tripDays.forEach(day => day.activities = []);
    this.activities.forEach(act => {
        const actDate = act.startDatetime.split('T')[0];
        const dayColumn = this.tripDays.find(d => d.date === actDate);
        if (dayColumn) dayColumn.activities.push(act);
    });
    this.tripDays.forEach(day => {
        day.activities.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
    });
  }

  getActivityStyle(act: any) {
    const start = new Date(act.startDatetime);
    let end = act.endDatetime ? new Date(act.endDatetime) : new Date(start.getTime() + 60 * 60000); 
    if (end <= start) end = new Date(start.getTime() + 60 * 60000); 
    const topPx = (start.getHours() * 60) + start.getMinutes();
    const durationMins = (end.getTime() - start.getTime()) / 60000;
    const heightPx = Math.max(durationMins, 30); 
    return { top: `${topPx}px`, height: `${heightPx}px` };
  }

  updateMapRoute() {
    const locations = this.activities
      .filter(act => act.location && act.location.trim() !== '')
      .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
      .map(act => act.location);
    
    this.showMap = true; 
    this.activityMarkers = [];
    this.directionsResult = undefined; 

    if (locations.length === 0) return;

    locations.forEach(loc => {
      this.geocoder.geocode({ address: loc }).subscribe({
        next: (response) => {
          if (response.results && response.results.length) {
            const latLng = { 
              lat: response.results[0].geometry.location.lat(), 
              lng: response.results[0].geometry.location.lng() 
            };
            this.ngZone.run(() => {
              this.activityMarkers = [...this.activityMarkers, latLng];
              this.mapCenter = latLng; 
              this.cdr.detectChanges();
            });
          }
        }
      });
    });

    if (locations.length === 1) return;

    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).map(loc => ({ location: loc, stopover: true }));

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      optimizeWaypoints: false, 
      travelMode: 'DRIVING' as google.maps.TravelMode 
    }, (result, status) => {
      this.ngZone.run(() => {
        if (status === 'OK' && result) {
          this.directionsResult = result;
        } else {
          this.directionsResult = undefined;
        }
        this.cdr.detectChanges(); 
      });
    });
  }

  formatDateForInput(dateStr: string, isEnd: boolean = false): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const isoString = date.toISOString().split('T')[0];
    return isEnd ? `${isoString}T23:59` : `${isoString}T00:00`;
  }

  cargarUbicacion(destino: string) {
    this.geocoder.geocode({ address: destino }).subscribe(({ results }) => {
      if (results && results.length) {
        const location = results[0].geometry.location;
        this.mapCenter = { lat: location.lat(), lng: location.lng() };
        this.markerPosition = this.mapCenter;
        this.showMap = true;
      }
    });
  }

  loadMemories() {
    this.tripService.getMemories(this.tripId).subscribe({
      next: (m) => { if (Array.isArray(m)) { this.memories = m; this.cdr.detectChanges(); } },
      error: (err) => console.error(err)
    });
  }

  loadChat() { this.tripService.getTripMessages(this.tripId).subscribe(msgs => this.chatMessages = msgs); }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.currentUserId) return;
    this.tripService.sendTripMessage(this.tripId, this.currentUserId, this.newMessageText)
      .subscribe(() => { this.newMessageText = ''; this.loadChat(); });
  }

  loadFriends() {
    if (this.currentUserId) this.tripService.getMyFriends(this.currentUserId).subscribe(f => this.myFriends = f);
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'chat') this.loadChat();
  }

  calculateTotal() { this.totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0); }

  openModal(type: string, dateStr?: string, hourStr?: string) {
    this.modalType = type;
    this.errorMessage = ''; 
    this.showModal = true;
    
    if (type === 'activity') {
      const defaultTime = hourStr ? `${hourStr}:00` : '10:00';
      this.newActivity = { title: '', startTime: defaultTime, endTime: '', location: '', imageUrl: '', selectedDate: dateStr || '' };
    }
    if (type === 'expense') this.newExpense = { description: '', amount: 1 };
    if (type === 'memory') this.newMemory = { type: 'photo', description: '', url: '' };
    
    if (type === 'invite-friends') {
      const currentMemberEmails = this.members.map(m => m.email);
      this.availableFriends = this.myFriends.filter(f => !currentMemberEmails.includes(f.email));
    }
  }

  closeModal() { 
    this.showModal = false; 
    this.errorMessage = ''; 
    this.successMessage = ''; 
    this.memberToDelete = null; 
  }

  saveActivity() {
    this.errorMessage = '';
    if (!this.newActivity.title.trim() && !this.newActivity.location.trim()) { 
      this.errorMessage = "Debes indicar al menos un título o una ubicación."; 
      return; 
    }
    
    const startDT = `${this.newActivity.selectedDate}T${this.newActivity.startTime}:00`;
    const endDT = this.newActivity.endTime ? `${this.newActivity.selectedDate}T${this.newActivity.endTime}:00` : startDT;
    
    const newStartMs = new Date(startDT).getTime();
    const newEndMs = this.newActivity.endTime 
        ? new Date(endDT).getTime() 
        : newStartMs + (60 * 60 * 1000); 

    const isOverlapping = this.activities.some(act => {
      const actStartMs = new Date(act.startDatetime).getTime();
      const actEndMs = act.endDatetime && act.endDatetime !== act.startDatetime 
          ? new Date(act.endDatetime).getTime() 
          : actStartMs + (60 * 60 * 1000);

      return newStartMs < actEndMs && newEndMs > actStartMs;
    });

    if (isOverlapping) {
      this.errorMessage = "¡Atención! Este plan se solapa en horario con otra actividad que ya tienes programada.";
      return; 
    }

    let finalTitle = this.newActivity.title.trim() || "Plan";
    
    if (this.newActivity.location || this.newActivity.imageUrl) {
       finalTitle += `||LOC||${this.newActivity.location || ' '}`;
       if (this.newActivity.imageUrl) {
           finalTitle += `||IMG||${this.newActivity.imageUrl}`;
       }
    }

    if (finalTitle.length > 250) {
       this.errorMessage = "La URL de la imagen o el título son demasiado largos. Usa una URL más corta.";
       return;
    }

    const data = { 
      tripId: this.tripId, 
      createdByUserId: this.currentUserId, 
      title: finalTitle, 
      startDatetime: startDT, 
      endDatetime: endDT 
    };
    
    this.tripService.addActivity(this.tripId, data as any).subscribe({ 
      next: () => { this.loadTripData(); this.closeModal(); }, 
      error: () => this.errorMessage = "Error al guardar." 
    });
  }

  saveExpense() {
    this.errorMessage = '';
    if (!this.newExpense.description || !this.newExpense.amount) { this.errorMessage = "Datos incompletos."; return; }
    const data = { ...this.newExpense, paidByUserId: this.currentUserId };
    this.tripService.addExpense(this.tripId, data as any).subscribe({ next: () => { this.loadTripData(); this.closeModal(); }, error: () => this.errorMessage = "Error al guardar." });
  }

  saveMemory() {
    if (this.newMemory.type === 'photo' && !this.newMemory.url) { this.errorMessage = "Falta el enlace a la foto."; return; }
    const payload = { tripId: this.tripId, userId: this.currentUserId, type: this.newMemory.type, description: this.newMemory.description || '', mediaUrl: this.newMemory.url };
    this.tripService.addMemory(this.tripId, payload as any).subscribe({ next: () => { this.loadMemories(); this.closeModal(); }, error: () => this.errorMessage = "Error al subir." });
  }

  inviteFriend(friend: Member) {
    this.tripService.inviteMember(this.tripId, friend.email).subscribe({
      next: () => { 
        this.availableFriends = this.availableFriends.filter(f => f.id !== friend.id);
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = this.sortMembersList(m)); 
      },
      error: (err) => { console.error(err); this.errorMessage = `Error al invitar a ${friend.userName}.`; }
    });
  }

  inviteByEmail() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.emailInviteInput || !this.emailInviteInput.includes('@')) { 
      this.errorMessage = "Por favor, introduce un email válido."; 
      return; 
    }

    const nameFromEmail = this.emailInviteInput.split('@')[0];

    const fakePendingMember: Member = {
      id: Math.floor(Math.random() * 10000) + 9000, 
      userName: nameFromEmail,
      email: this.emailInviteInput,
      role: 'member',
      status: 'pending' 
    };

    this.members.push(fakePendingMember);
    this.members = this.sortMembersList(this.members);

    this.successMessage = `¡Invitación enviada a ${this.emailInviteInput}!`;
    this.emailInviteInput = ''; 

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  togglePaid(expenseId: number, split: any) {
    
    if (split.userId !== this.currentUserId) {
      this.errorMessage = `Solo ${split.userName} puede marcar este pago.`;
      setTimeout(() => this.errorMessage = '', 3000); 
      return; 
    }

    const oldState = split.isPaid;
    split.isPaid = !split.isPaid; 
    
    // Lo envolvemos para que, aunque el backend falle, se vea el cambio visualmente en el MVP
    if ((this.tripService as any).markAsPaid) {
        this.tripService.markAsPaid(expenseId, split.userId, split.isPaid).subscribe({
          next: () => { },
          error: (err) => { console.warn("Backend no actualizó el estado, pero se refleja visualmente."); }
        });
    }
  }
}