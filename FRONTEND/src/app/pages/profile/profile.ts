import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { RouterModule } from '@angular/router'; // Importar router si usas routerLink en el HTML

// 1. Imports para Google Maps y Servicios
import { GoogleMapsModule, MapGeocoder } from '@angular/google-maps';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  // 2. Añadir GoogleMapsModule y RouterModule a imports
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule, GoogleMapsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  isEditModalOpen: boolean = false;
  activeTab: string = 'trips'; // 'trips' | 'photos' | 'map'

  // Datos de estadísticas (se actualizarán dinámicamente)
  stats = {
    countries: 0,
    trips: 0,
    followers: 145 // Dato simulado
  };

  // Lista de viajes real
  myTrips: any[] = [];

  // --- CONFIGURACIÓN DEL MAPA MUNDIAL ---
  worldMapOptions: google.maps.MapOptions = {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    disableDefaultUI: false,
    styles: [
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
      }
    ]
  };
  
  // Array para guardar los pines del mapa
  tripMarkers: any[] = [];

  constructor(
    private tripService: TripService,
    private geocoder: MapGeocoder
  ) {}

  ngOnInit(): void {
    // 1. Cargar Usuario
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      // 2. Cargar Viajes Reales si hay usuario
      this.loadUserTrips(this.user.id);
    } else {
      this.user = {
        userName: 'Invitado',
        email: 'invitado@tripshare.com',
        bio: 'Amante de los viajes y la fotografía.',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
      };
    }
  }

  // --- CARGA DE DATOS REALES ---
  loadUserTrips(userId: number) {
    this.tripService.getTripsByUserId(userId).subscribe({
      next: (trips) => {
        // Mapeamos los datos de la BD al formato visual de la tarjeta
        this.myTrips = trips.map((t: any) => ({
          id: t.id,
          title: t.name,
          destination: t.destination,
          date: new Date(t.startDate).toLocaleDateString(), 
          // Usamos una imagen genérica de Unsplash basada en el destino
          image: `https://source.unsplash.com/random/800x600/?travel,${t.destination}`
        }));

        // Actualizamos estadísticas
        this.stats.trips = trips.length;
        // Set simple para contar países únicos (asumiendo destino = país o ciudad)
        const uniqueDestinations = new Set(trips.map((t: any) => t.destination));
        this.stats.countries = uniqueDestinations.size;

        // Generamos los pines para el mapa
        this.generateMapMarkers(trips);
      },
      error: (err) => console.error('Error cargando viajes', err)
    });
  }

  generateMapMarkers(trips: any[]) {
    this.tripMarkers = []; // Limpiar anteriores
    trips.forEach((trip) => {
      this.geocoder.geocode({ address: trip.destination }).subscribe(({ results }) => {
        if (results && results.length) {
          const loc = results[0].geometry.location;
          this.tripMarkers.push({
            position: { lat: loc.lat(), lng: loc.lng() },
            title: trip.name, // El nombre del viaje aparecerá al pasar el mouse
            options: { animation: google.maps.Animation.DROP } // Efecto visual de caída
          });
        }
      });
    });
  }

  // --- Lógica del Modal de Edición ---
  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
  }

  // --- Lógica de Pestañas ---
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}