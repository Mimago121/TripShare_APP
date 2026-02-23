import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { RouterModule } from '@angular/router';
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
  isEditModalOpen: boolean = false;
  activeTab: string = 'trips'; // Pestañas: 'trips', 'photos', 'map'
  
  stats = { countries: 0, trips: 0, followers: 145 };
  myTrips: any[] = [];
  myPhotos: any[] = []; // <--- Aquí guardaremos las fotos del usuario

  // Configuración del Mapa
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
    private geocoder: MapGeocoder
  ) {}

 ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      
      // 1. Cargar Viajes
      this.loadUserTrips(this.user.id);

      // 2. Cargar Pines Manuales
      this.loadVisitedPlaces(this.user.id);

      // 3. Cargar Fotos del Usuario
      this.loadUserPhotos(this.user.id);
    }
  }

  // --- NUEVA LÓGICA DE FOTOS ---
  loadUserPhotos(userId: number) {
    this.tripService.getUserMemories(userId).subscribe({
      next: (memories) => {
        // Filtramos para mostrar SOLO las memorias que son tipo 'photo'
        this.myPhotos = memories.filter((m: any) => m.type === 'photo');
      },
      error: (err) => console.error("Error cargando fotos del perfil:", err)
    });
  }

  // --- MAPAS Y PINES ---
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
      },
      error: (err) => console.error("Error cargando pines:", err)
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
          image: `https://source.unsplash.com/random/800x600/?travel,${t.destination}`
        }));
        this.stats.trips = trips.length;
        this.generateMapMarkers(trips);
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
    if (!this.newPlaceName.trim()) return;

    this.geocoder.geocode({ address: this.newPlaceName }).subscribe(({ results }) => {
      if (results && results.length) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();

        const newPin = {
            userId: this.user.id, 
            name: this.newPlaceName,
            latitude: lat,
            longitude: lng
        };

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

  // --- UI Y MODALES ---
  openEditModal() { this.isEditModalOpen = true; }
  closeEditModal() { this.isEditModalOpen = false; }
  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
  }
  setActiveTab(tab: string) { this.activeTab = tab; }
}