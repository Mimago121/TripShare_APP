import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  activities: any[] = [];
  expenses: any[] = [];
  memories: any[] = [];
  members: any[] = []; 
  myFriends: Member[] = []; 
  
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
  selectedFriendEmail: string = '';
  
  // NUEVO: Variable para controlar los mensajes de error del formulario
  errorMessage: string = '';

  newActivity = { title: '', startTime: '10:00', endTime: '', location: '', selectedDate: '' };
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
    private ngZone: NgZone
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

  get displayedMembers() { return this.members.slice(0, 3); }
  get remainingMembersCount() { return this.members.length > 3 ? this.members.length - 3 : 0; }

  loadTripData() {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (data) => {
        this.trip = data;
        if (this.trip) {
          this.minTripDate = this.formatDateForInput(this.trip.startDate);
          this.maxTripDate = this.formatDateForInput(this.trip.endDate, true);
          if (this.trip.destination) this.cargarUbicacion(this.trip.destination);
          this.generateTripDays();
        }

        this.tripService.getActivities(this.tripId).subscribe(a => {
          this.activities = a;
          this.groupActivitiesByDay(); 
          this.updateMapRoute(); 
        });
        
        this.tripService.getExpenses(this.tripId).subscribe(e => {
          this.expenses = e;
          this.calculateTotal();
        });
        
        this.loadMemories();
        this.tripService.getMembers(this.tripId).subscribe(mem => this.members = this.sortMembersList(mem));
        this.loadChat();
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false
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

  private sortMembersList(membersList: any[]): any[] {
    return membersList.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1;
      if (a.role !== 'owner' && b.role === 'owner') return 1;
      if (a.status === 'pending' && b.status !== 'pending') return 1;
      if (a.status !== 'pending' && b.status === 'pending') return -1;
      return a.userName.localeCompare(b.userName);
    });
  }

  updateMapRoute() {
    const locations = this.activities
      .filter(act => act.location && act.location.trim() !== '')
      .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
      .map(act => act.location);

    this.activityMarkers = [];
    if (locations.length === 0) return;

    locations.forEach(loc => {
      this.geocoder.geocode({ address: loc }).subscribe(({ results }) => {
        if (results && results.length) {
          const latLng = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
          this.activityMarkers.push(latLng);
          this.mapCenter = latLng; 
          this.cdr.detectChanges();
        }
      });
    });

    if (locations.length === 1) {
      this.directionsResult = undefined;
      return;
    }

    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).map(loc => ({ location: loc, stopover: true }));

    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: origin, destination: destination, waypoints: waypoints,
      optimizeWaypoints: false, travelMode: google.maps.TravelMode.WALKING 
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        this.directionsResult = result;
      } else {
        this.directionsResult = undefined;
      }
      this.cdr.detectChanges();
    });
  }

  formatDateForInput(dateStr: string, isEnd: boolean = false): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const isoString = date.toISOString().split('T')[0];
    return isEnd ? `${isoString}T23:59` : `${isoString}T00:00`;
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
    this.errorMessage = ''; // Limpiamos errores previos al abrir
    this.showModal = true;
    
    if (type === 'activity') {
      const defaultTime = hourStr ? `${hourStr}:00` : '10:00';
      this.newActivity = { title: '', startTime: defaultTime, endTime: '', location: '', selectedDate: dateStr || '' };
    }
    if (type === 'expense') this.newExpense = { description: '', amount: 1 };
    if (type === 'memory') this.newMemory = { type: 'photo', description: '', url: '' };
  }

  closeModal() { 
    this.showModal = false; 
    this.errorMessage = ''; // Limpiamos errores al cerrar
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type.match(/image\/*/)) {
      this.compressImage(file, 800, 0.7).then(compressedBase64 => this.newMemory.url = compressedBase64);
    }
  }

  compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width; let height = img.height;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); } 
          else { reject(new Error("Canvas error")); }
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  saveActivity() {
    this.errorMessage = ''; // Reseteamos error

    if (!this.newActivity.title.trim() && !this.newActivity.location.trim()) {
      this.errorMessage = "Debes indicar al menos un título o una ubicación para el plan.";
      return;
    }

    const startDT = `${this.newActivity.selectedDate}T${this.newActivity.startTime}:00`;
    const endDT = this.newActivity.endTime ? `${this.newActivity.selectedDate}T${this.newActivity.endTime}:00` : startDT;

    const data = { 
      tripId: this.tripId, createdByUserId: this.currentUserId, title: this.newActivity.title,
      startDatetime: startDT, endDatetime: endDT, location: this.newActivity.location
    };
    
    this.tripService.addActivity(this.tripId, data as any).subscribe(() => {
      this.loadTripData(); 
      this.closeModal();
    });
  }

  saveExpense() {
    this.errorMessage = ''; // Reseteamos error

    if (!this.newExpense.description || this.newExpense.description.trim() === '') {
      this.errorMessage = "El concepto del gasto no puede estar vacío.";
      return;
    }
    if (this.newExpense.amount < 1) {
      this.errorMessage = "La cantidad mínima para un gasto es de 1 €.";
      return;
    }

    const data = { ...this.newExpense, paidByUserId: this.currentUserId };
    this.tripService.addExpense(this.tripId, data as any).subscribe(() => { 
      this.loadTripData(); 
      this.closeModal(); 
    });
  }

saveMemory() {
    this.errorMessage = ''; 
    
    // 1. Validamos que haya una foto seleccionada
    if (this.newMemory.type === 'photo' && !this.newMemory.url) {
      this.errorMessage = "Debes seleccionar una foto para subir.";
      return;
    }

    // 2. Preparamos los datos con el código Base64 gigante de la imagen
    const payload = { 
      tripId: this.tripId, 
      userId: this.currentUserId, 
      type: this.newMemory.type,
      description: this.newMemory.description || '', 
      mediaUrl: this.newMemory.url // <-- Aquí va la foto comprimida
    };

    // 3. Lo enviamos al servidor real
    this.tripService.addMemory(this.tripId, payload as any).subscribe({
      next: () => { 
        // Si todo va bien, recargamos la lista desde la Base de Datos y cerramos
        this.loadMemories(); 
        this.closeModal(); 
      },
      error: (err) => {
        console.error("Error del backend:", err);
        // Si el backend explota, mostramos el banner de error
        this.errorMessage = "El servidor rechazó la imagen. Asegúrate de que el backend acepta textos largos (LONGTEXT).";
      }
    });
  }

  inviteSelectedFriend() {
    this.errorMessage = '';
    if (!this.selectedFriendEmail) return;
    
    this.tripService.inviteMember(this.tripId, this.selectedFriendEmail).subscribe({
      next: () => { 
        this.selectedFriendEmail = ''; 
        // Recargamos y ordenamos la lista de miembros
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = this.sortMembersList(m)); 
      },
      error: (err) => {
        console.error(err);
        alert("Error al invitar al usuario.");
      }
    });
  }

  inviteByEmail() {
    const email = prompt("Email del invitado:");
    if (email) {
      this.tripService.inviteMember(this.tripId, email).subscribe({
        next: () => { 
          this.tripService.getMembers(this.tripId).subscribe(m => this.members = this.sortMembersList(m)); 
        },
        error: (err) => {
          console.error(err);
          alert("Error al invitar por email.");
        }
      });
    }
  }

  togglePaid(expenseId: number, split: any) {
    const newState = !split.isPaid;
    split.isPaid = newState; 

    this.tripService.markAsPaid(expenseId, split.userId, newState).subscribe({
      next: () => {  },
      error: (err) => { 
        split.isPaid = !newState; 
        console.error("Error al cambiar estado de pago:", err);
      }
    });
  }
}