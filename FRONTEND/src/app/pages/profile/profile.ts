import { Component, OnInit, ViewChild } from '@angular/core'; // Añadido ViewChild
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { GoogleMapsModule, MapGeocoder, GoogleMap } from '@angular/google-maps'; // Añadido GoogleMap
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule, GoogleMapsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild(GoogleMap) map!: GoogleMap; // Para controlar el mapa visualmente

  user: any = {};
  isEditModalOpen: boolean = false;
  activeTab: string = 'trips';
  
  stats = { countries: 0, trips: 0, followers: 145 };
  myTrips: any[] = [];

  // --- CONFIGURACIÓN DEL MAPA ---
  worldMapOptions: google.maps.MapOptions = {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    disableDefaultUI: false,
    styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
  };
  
  tripMarkers: any[] = [];
  
  // NUEVA VARIABLE: Para el input de "Añadir sitio"
  newPlaceName: string = '';

  constructor(
    private tripService: TripService,
    private geocoder: MapGeocoder
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.loadUserTrips(this.user.id);
    }
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
        const uniqueDestinations = new Set(trips.map((t: any) => t.destination));
        this.stats.countries = uniqueDestinations.size;

        this.generateMapMarkers(trips);
      },
      error: (err) => console.error('Error cargando viajes', err)
    });
  }

  generateMapMarkers(trips: any[]) {
    this.tripMarkers = [];
    trips.forEach((trip) => {
      this.geocoder.geocode({ address: trip.destination }).subscribe(({ results }) => {
        if (results && results.length) {
          const loc = results[0].geometry.location;
          this.tripMarkers.push({
            position: { lat: loc.lat(), lng: loc.lng() },
            title: trip.name,
            icon: null // Icono por defecto (rojo)
          });
        }
      });
    });
  }

  // --- NUEVA FUNCIÓN: AÑADIR PIN MANUALMENTE ---
  addPlace() {
    if (!this.newPlaceName.trim()) return;

    this.geocoder.geocode({ address: this.newPlaceName }).subscribe(({ results }) => {
      if (results && results.length) {
        const loc = results[0].geometry.location;
        
        // 1. Añadimos el pin al array
        this.tripMarkers.push({
          position: { lat: loc.lat(), lng: loc.lng() },
          title: this.newPlaceName,
          // Opcional: Icono azul para diferenciar manuales de viajes reales
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
        });

        // 2. Movemos el mapa allí
        this.map.panTo({ lat: loc.lat(), lng: loc.lng() });
        this.map.googleMap?.setZoom(5);

        // 3. Limpiamos el input
        this.newPlaceName = '';

        // NOTA: Aquí deberías llamar a tu backend para guardar este "lugar visitado"
        // si quieres que persista al recargar la página.
        // Ejemplo: this.tripService.addVisitedPlace(this.user.id, this.newPlaceName)...
      } else {
        alert('No pudimos encontrar ese lugar. Prueba con "Ciudad, País".');
      }
    });
  }

  openEditModal() { this.isEditModalOpen = true; }
  closeEditModal() { this.isEditModalOpen = false; }
  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
  }
  setActiveTab(tab: string) { this.activeTab = tab; }
}