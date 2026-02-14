import { Component, OnInit } from '@angular/core';
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
  
  // --- VARIABLES NUEVAS DEL CHAT ---
  chatMessages: any[] = [];
  newMessageText: string = '';

  tripId!: number;
  currentUserId: number | null = null;
  activeTab: string = 'itinerary';
  isLoading: boolean = true;
  totalExpenses: number = 0;

  // Variables para formularios
  showModal: boolean = false;
  modalType: string = '';
  selectedFriendEmail: string = '';

  newActivity = { title: '', start: '', end: '' };
  newExpense = { description: '', amount: 0 };
  newMemory = { type: 'photo', description: '', url: '' };

  // --- VARIABLES GOOGLE MAPS ---
  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  markerPosition: google.maps.LatLngLiteral | undefined;
  mapCenter: google.maps.LatLngLiteral = { lat: 40.416, lng: -3.703 };
  showMap: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private geocoder: MapGeocoder
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

  loadTripData() {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (data) => {
        this.trip = data;

        // Cargar mapa si hay destino
        if (this.trip && this.trip.destination) {
            this.cargarUbicacion(this.trip.destination);
        }

        this.tripService.getActivities(this.tripId).subscribe(a => this.activities = a);
        this.tripService.getExpenses(this.tripId).subscribe(e => {
          this.expenses = e;
          this.calculateTotal();
        });
        this.tripService.getMemories(this.tripId).subscribe(m => this.memories = m);
        this.tripService.getMembers(this.tripId).subscribe(mem => this.members = mem);
        
        // --- CARGAR EL CHAT ---
        this.loadChat();

        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // --- LÓGICA DEL CHAT GRUPAL (NUEVO) ---
  loadChat() {
    this.tripService.getTripMessages(this.tripId).subscribe(msgs => {
      this.chatMessages = msgs;
    });
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.currentUserId) return;

    this.tripService.sendTripMessage(this.tripId, this.currentUserId, this.newMessageText)
      .subscribe(() => {
        this.newMessageText = ''; // Limpiar input
        this.loadChat(); // Recargar mensajes
      });
  }

  // --- LÓGICA GOOGLE MAPS ---
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
    // Si entramos al chat, recargamos por si hay mensajes nuevos
    if (tab === 'chat') {
      this.loadChat();
    }
  }

  calculateTotal() {
    this.totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0);
  }

  openModal(type: string) {
    this.modalType = type;
    this.showModal = true;
    
    // Resetear formularios
    if (type === 'activity') this.newActivity = { title: '', start: '', end: '' };
    if (type === 'expense') this.newExpense = { description: '', amount: 0 };
    if (type === 'memory') this.newMemory = { type: 'photo', description: '', url: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  // --- PROCESAMIENTO DE IMÁGENES (NECESARIO PARA MODAL RECUERDOS) ---
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
          } else {
             reject(new Error("Canvas error"));
          }
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  // --- GUARDADO DE DATOS ---

  saveActivity() {
    const data = { 
      ...this.newActivity, 
      tripId: this.tripId, 
      createdByUserId: this.currentUserId,
      startDatetime: this.newActivity.start,
      endDatetime: this.newActivity.end || this.newActivity.start
    };
    this.tripService.addActivity(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  saveExpense() {
    const data = { 
      ...this.newExpense, 
      paidByUserId: this.currentUserId 
    };
    this.tripService.addExpense(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  saveMemory() {
    const data = { 
      ...this.newMemory, 
      userId: this.currentUserId,
      mediaUrl: this.newMemory.url 
    };
    this.tripService.addMemory(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
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
    if (split.isPaid) return; // Si ya está pagado, no hacemos nada (o podrías implementar desmarcar)

    this.tripService.markAsPaid(expenseId, split.userId).subscribe({
      next: () => {
        // Actualizamos visualmente sin recargar
        split.isPaid = true; 
      },
      error: (err) => console.error(err)
    });
  }
}