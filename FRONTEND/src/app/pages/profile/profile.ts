import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { RouterModule, ActivatedRoute } from '@angular/router'; // <-- Importamos ActivatedRoute
import { GoogleMapsModule, MapGeocoder, GoogleMap } from '@angular/google-maps';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule, GoogleMapsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild(GoogleMap) map!: GoogleMap;

  user: any = {};
  currentUserId: number = 0;
  viewedUserId: number = 0;
  isMyProfile: boolean = true; // <-- Controla si es tu perfil o el de otro
  isEditModalOpen: boolean = false;
  activeTab: string = 'trips'; 
  
  // STATS REALES
  stats = { countries: 0, trips: 0, friends: 0 };
  
  myTrips: any[] = [];
  myPhotos: any[] = []; 

  // --- VARIABLES DE GAMIFICACIÓN ---
  level: number = 1;
  xp: number = 0;
  nextLevelXp: number = 500;
  xpProgress: number = 0;
  badges: any[] = [];

  worldMapOptions: google.maps.MapOptions = {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    disableDefaultUI: false,
    styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
  };
  
  tripMarkers: any[] = [];
  newPlaceName: string = '';

  constructor(
    private tripService: TripService,
    private geocoder: MapGeocoder,
    private route: ActivatedRoute // <-- Inyectamos para leer la URL
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.currentUserId = parsedUser.id;

      // Verificamos si la URL tiene un ID de otro usuario (ej: /profile/5)
      this.route.params.subscribe(params => {
        if (params['id'] && Number(params['id']) !== this.currentUserId) {
          this.isMyProfile = false;
          this.viewedUserId = Number(params['id']);
        } else {
          this.isMyProfile = true;
          this.viewedUserId = this.currentUserId;
        }

        this.loadUserInfo();
        this.loadAllData(this.viewedUserId);
      });
    }
  }

  // Carga los datos del perfil (los tuyos o los del amigo)
  loadUserInfo() {
    if (this.isMyProfile) {
      this.user = JSON.parse(localStorage.getItem('user')!);
    } else {
      // TRUCO NINJA FRONTEND: Capturamos los datos ocultos que viajan en el clic del enlace
      const navState = window.history.state;
      
      if (navState && navState.memberData) {
        // Si venimos de la lista de amigos/viaje, usamos su nombre real
        this.user = { 
          userName: navState.memberData.userName, 
          // Si no tiene foto, dejamos vacío y el HTML generará sus iniciales automáticamente
          avatarUrl: navState.memberData.avatarUrl || '', 
          bio: '¡Adict@ a los viajes y a descubrir nuevos destinos!' 
        };
      } else {
        // Si recargas la página con F5 (y se pierde el estado), usamos el genérico
        this.user = { userName: `Viajero #${this.viewedUserId}`, bio: 'Explorando el mundo...' };
        
        // (Opcional) Si en el futuro le enseñas a Ktor a buscar usuarios, Angular lo hará solo:
        if ((this.tripService as any).getUserById) {
          (this.tripService as any).getUserById(this.viewedUserId).subscribe({
            next: (data: any) => this.user = data
          });
        }
      }
    }
  }

  loadAllData(userId: number) {
    this.loadUserTrips(userId);
    this.loadVisitedPlaces(userId);
    this.loadUserPhotos(userId);
    this.loadUserFriends(userId);
  }

  // --- MOTOR DE GAMIFICACIÓN (100% FRONTEND) ---
  calculateGamification() {
    // 1. Calculamos la Experiencia (XP)
    this.xp = (this.stats.trips * 150) + 
              (this.stats.countries * 100) + 
              (this.myPhotos.length * 20) + 
              (this.stats.friends * 30);

    // 2. Calculamos el Nivel (Cada 500 XP es un nivel)
    this.level = Math.floor(this.xp / 500) + 1;
    this.nextLevelXp = this.level * 500;
    this.xpProgress = ((this.xp % 500) / 500) * 100;

    // 3. Otorgamos Insignias según los logros
    this.badges = [];
    if (this.stats.trips === 0) {
      this.badges.push({ icon: '🎒', name: 'Novato', color: '#64748b', bg: '#f1f5f9' });
    }
    if (this.stats.trips >= 1) {
      this.badges.push({ icon: '✈️', name: 'Viajero', color: '#0284c7', bg: '#e0f2fe' });
    }
    if (this.stats.trips >= 5) {
      this.badges.push({ icon: '🗺️', name: 'Explorador', color: '#7c3aed', bg: '#ede9fe' });
    }
    if (this.stats.countries >= 3) {
      this.badges.push({ icon: '🌍', name: 'Trotamundos', color: '#16a34a', bg: '#dcfce7' });
    }
    if (this.myPhotos.length >= 1) {
      this.badges.push({ icon: '📸', name: 'Paparazzi', color: '#ea580c', bg: '#fff7ed' });
    }
    if (this.stats.friends >= 3) {
      this.badges.push({ icon: '🤝', name: 'Sociable', color: '#db2777', bg: '#fce7f3' });
    }
  }

  // --- CARGA DE DATOS ---
  loadUserFriends(userId: number) {
    this.tripService.getMyFriends(userId).subscribe({
      next: (friends) => {
        this.stats.friends = friends.length;
        this.calculateGamification(); // Recalcula XP
      }
    });
  }

  loadUserPhotos(userId: number) {
    this.tripService.getUserMemories(userId).subscribe({
      next: (memories) => {
        this.myPhotos = memories.filter((m: any) => m.type === 'photo');
        this.calculateGamification(); // Recalcula XP
      }
    });
  }

  loadVisitedPlaces(userId: number) {
    this.tripService.getVisitedPlaces(userId).subscribe({
      next: (places) => {
        places.forEach(p => {
          this.tripMarkers.push({
            position: { lat: p.latitude, lng: p.longitude },
            title: p.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
          });
        });
      }
    });
  }

  loadUserTrips(userId: number) {
    this.tripService.getTripsByUserId(userId).subscribe({
      next: (trips) => {
        this.myTrips = trips.map((t: any) => ({
          id: t.id,
          title: t.name,
          destination: t.destination,
          date: new Date(t.startDate).toLocaleDateString(), 
          image: t.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop'
        }));
        
        this.stats.trips = trips.length;
        const uniqueDestinations = new Set(trips.map((t: any) => t.destination.toLowerCase().trim()));
        this.stats.countries = uniqueDestinations.size;

        this.generateMapMarkers(trips);
        this.calculateGamification(); // Recalcula XP
      }
    });
  }

  generateMapMarkers(trips: any[]) {
    trips.forEach((trip) => {
      this.geocoder.geocode({ address: trip.destination }).subscribe(({ results }) => {
        if (results && results.length) {
          const loc = results[0].geometry.location;
          this.tripMarkers.push({
            position: { lat: loc.lat(), lng: loc.lng() },
            title: trip.name,
            icon: null 
          });
        }
      });
    });
  }

  addPlace() {
    if (!this.newPlaceName.trim() || !this.isMyProfile) return;

    this.geocoder.geocode({ address: this.newPlaceName }).subscribe(({ results }) => {
      if (results && results.length) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();

        const newPin = { userId: this.user.id, name: this.newPlaceName, latitude: lat, longitude: lng };

        this.tripService.addVisitedPlace(newPin).subscribe({
            next: () => {
                this.tripMarkers.push({
                  position: { lat, lng },
                  title: this.newPlaceName,
                  icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                });
                this.map.panTo({ lat, lng });
                this.newPlaceName = '';
            },
            error: (err) => alert("Error guardando: " + err.message)
        });
      }
    });
  }

  onFileSelected(event: any, type: 'avatar' | 'cover') {
    const file: File = event.target.files[0];
    if (file && file.type.match(/image\/*/)) {
      const maxWidth = type === 'avatar' ? 400 : 1200;
      this.compressImage(file, maxWidth, 0.8).then(compressedBase64 => {
        if (type === 'avatar') this.user.avatarUrl = compressedBase64;
        else this.user.coverUrl = compressedBase64;
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

  openEditModal() { if (this.isMyProfile) this.isEditModalOpen = true; }
  closeEditModal() { this.isEditModalOpen = false; }
  
  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
  }
  
  setActiveTab(tab: string) { this.activeTab = tab; }
}