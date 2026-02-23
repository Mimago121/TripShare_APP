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

  // --- NUEVAS VARIABLES PARA RUTAS Y FECHAS ---
  newActivity = { title: '', start: '', end: '', location: '' };
  minTripDate: string = '';
  maxTripDate: string = '';

  newExpense = { description: '', amount: 0 };
  newMemory = { type: 'photo', description: '', url: '' };

  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  markerPosition: google.maps.LatLngLiteral | undefined;
  mapCenter: google.maps.LatLngLiteral = { lat: 40.416, lng: -3.703 };
  showMap: boolean = false;
  // Lista de pines sueltos por si falla la ruta
  activityMarkers: google.maps.LatLngLiteral[] = [];
  
  // Variable para guardar la ruta generada (Wanderlog style)
  directionsResult: google.maps.DirectionsResult | undefined;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private geocoder: MapGeocoder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone // <-- 1. AÑADIMOS ESTO
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUserId = JSON.parse(userStr).id;
      }
    }

    this.route.params.subscribe(params => {
      this.tripId = Number(params['id']);
      if (this.tripId) {
        this.loadTripData();
        this.loadFriends();
      }
    });
  }

  // --- MAGIA DEL AUTOCOMPLETADO DE GOOGLE PLACES ---
  @ViewChild('locationInput') set locationInput(el: ElementRef) {
    if (el && typeof google !== 'undefined' && google.maps.places) {
      // Convertimos el input en un buscador de lugares
      const autocomplete = new google.maps.places.Autocomplete(el.nativeElement, {
        fields: ['formatted_address', 'name'] // Queremos que nos devuelva la dirección completa
      });

      // Escuchamos cuando el usuario hace clic en una sugerencia
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          // Guardamos la dirección oficial (Ej: "Museo Nacional del Prado, Madrid, España")
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

        // Configuramos los límites del calendario para que coincidan con el viaje
        if (this.trip) {
          this.minTripDate = this.formatDateForInput(this.trip.startDate);
          // Le sumamos 23:59 al día de fin para permitir actividades el último día
          this.maxTripDate = this.formatDateForInput(this.trip.endDate, true);
        }

        if (this.trip && this.trip.destination) {
            this.cargarUbicacion(this.trip.destination);
        }

        this.tripService.getActivities(this.tripId).subscribe(a => {
          this.activities = a;
          this.updateMapRoute(); // <-- DIBUJA LA RUTA AUTOMÁTICAMENTE
        });
        
        this.tripService.getExpenses(this.tripId).subscribe(e => {
          this.expenses = e;
          this.calculateTotal();
        });
        
        this.loadMemories();
        this.tripService.getMembers(this.tripId).subscribe(mem => this.members = mem);
        this.loadChat();
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // --- LÓGICA DE RUTAS AUTOMÁTICAS (WANDERLOG STYLE) ---
  // --- LÓGICA DE RUTAS AUTOMÁTICAS MEJORADA ---
  updateMapRoute() {
    const locations = this.activities
      .filter(act => act.location && act.location.trim() !== '')
      .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
      .map(act => act.location);

    // 1. Limpiamos los marcadores previos de la pantalla
    this.activityMarkers = [];

    if (locations.length === 0) return;

    // 2. Convertimos todos los textos a coordenadas reales (Pines sueltos)
    locations.forEach(loc => {
      this.geocoder.geocode({ address: loc }).subscribe(({ results }) => {
        if (results && results.length) {
          const latLng = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
          this.activityMarkers.push(latLng);
          
          // Centramos la cámara en el último pin añadido
          this.mapCenter = latLng; 
          this.cdr.detectChanges();
        }
      });
    });

    if (locations.length === 1) {
      this.directionsResult = undefined;
      return;
    }

    // 3. Intentamos trazar la RUTA CONECTADA (La línea azul)
    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).map(loc => ({ location: loc, stopover: true }));

    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      optimizeWaypoints: false, // Falso para respetar el orden cronológico
      travelMode: google.maps.TravelMode.WALKING // O DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        // ¡ÉXITO! Google nos devuelve la ruta
        this.directionsResult = result;
      } else {
        // ¡FALLO! (Probablemente la Directions API esté apagada)
        this.directionsResult = undefined;
        console.error("⚠️ No se pudo trazar la ruta azul. Estado devuelto por Google:", status);
        console.warn("👉 SOLUCIÓN: Ve a Google Cloud Console -> APIs y Servicios -> Habilita la 'Directions API'.");
      }
      this.cdr.detectChanges();
    });
  }

  // Formatea las fechas para el input de HTML
  formatDateForInput(dateStr: string, isEnd: boolean = false): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const isoString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return isEnd ? `${isoString}T23:59` : `${isoString}T00:00`;
  }

  loadMemories() {
    this.tripService.getMemories(this.tripId).subscribe({
      next: (m) => {
        if (Array.isArray(m)) {
           this.memories = m;
           this.cdr.detectChanges(); 
        }
      },
      error: (err) => console.error("Error cargando recuerdos:", err)
    });
  }

  loadChat() {
    this.tripService.getTripMessages(this.tripId).subscribe(msgs => this.chatMessages = msgs);
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.currentUserId) return;
    this.tripService.sendTripMessage(this.tripId, this.currentUserId, this.newMessageText)
      .subscribe(() => {
        this.newMessageText = ''; 
        this.loadChat(); 
      });
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
    if (this.currentUserId) {
      this.tripService.getMyFriends(this.currentUserId).subscribe(f => this.myFriends = f);
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'chat') this.loadChat();
  }

  calculateTotal() {
    this.totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0);
  }

  openModal(type: string) {
    this.modalType = type;
    this.showModal = true;
    
    if (type === 'activity') this.newActivity = { title: '', start: '', end: '', location: '' };
    if (type === 'expense') this.newExpense = { description: '', amount: 0 };
    if (type === 'memory') this.newMemory = { type: 'photo', description: '', url: '' };
  }

  closeModal() { this.showModal = false; }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type.match(/image\/*/)) {
      this.compressImage(file, 800, 0.7).then(compressedBase64 => {
        this.newMemory.url = compressedBase64;
      });
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
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             const dataUrl = canvas.toDataURL('image/jpeg', quality);
             resolve(dataUrl);
          } else { reject(new Error("Canvas error")); }
        };
      };
      reader.onerror = error => reject(error);
    });
  }

saveActivity() {
    // Verificación de fechas
    const actDate = new Date(this.newActivity.start);
    const minD = new Date(this.minTripDate);
    const maxD = new Date(this.maxTripDate);

    if(actDate < minD || actDate > maxD) {
      alert("Por favor, selecciona una fecha que esté dentro del viaje.");
      return;
    }

    // 🛑 MODO PRUEBA VISUAL (SIN BACKEND) 🛑
    // Creamos una actividad simulada con los datos que has puesto en el modal
    const mockActivity = {
      id: Math.floor(Math.random() * 1000), // ID inventado
      title: this.newActivity.title,
      startDatetime: this.newActivity.start,
      endDatetime: this.newActivity.end || this.newActivity.start,
      location: this.newActivity.location // Guardamos la ubicación localmente
    };

    // 1. Añadimos la actividad directamente a la lista visual de Angular
    this.activities.push(mockActivity);

    // 2. Obligamos al mapa a recalcular y dibujar la ruta
    this.updateMapRoute();

    // 3. Cerramos el modal
    this.closeModal();

    /* // === CÓDIGO REAL PARA CUANDO ARREGLES EL BACKEND ===
    // (Déjalo comentado de momento)
    const data = { 
      ...this.newActivity, 
      tripId: this.tripId, 
      createdByUserId: this.currentUserId,
      startDatetime: this.newActivity.start,
      endDatetime: this.newActivity.end || this.newActivity.start,
      location: this.newActivity.location
    };
    
    this.tripService.addActivity(this.tripId, data as any).subscribe(() => {
      this.loadTripData(); 
      this.closeModal();
    });
    */
  }

  saveExpense() {
    const data = { ...this.newExpense, paidByUserId: this.currentUserId };
    this.tripService.addExpense(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  saveMemory() {
    const payload = { 
      tripId: this.tripId,
      userId: this.currentUserId,
      type: this.newMemory.type,
      description: this.newMemory.description || '',
      mediaUrl: this.newMemory.url 
    };
    this.tripService.addMemory(this.tripId, payload as any).subscribe({
      next: () => { this.loadMemories(); this.closeModal(); },
      error: () => alert("Fallo al guardar.")
    });
  }

  inviteSelectedFriend() {
    if (!this.selectedFriendEmail) return;
    this.tripService.inviteMember(this.tripId, this.selectedFriendEmail).subscribe({
      next: () => {
        this.selectedFriendEmail = '';
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = m);
      }
    });
  }

  inviteByEmail() {
    const email = prompt("Email del invitado:");
    if (email) {
      this.tripService.inviteMember(this.tripId, email).subscribe(() => {
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = m);
      });
    }
  }

  togglePaid(expenseId: number, split: any) {
    if (split.isPaid) return; 
    this.tripService.markAsPaid(expenseId, split.userId).subscribe({
      next: () => { split.isPaid = true; },
      error: (err) => console.error(err)
    });
  }
}