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
  activeTab: string = 'trips';
  
  stats = { countries: 0, trips: 0, followers: 145 };
  myTrips: any[] = [];

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

      // 2. Cargar Pines Manuales (ESTA ES LA LÍNEA QUE TE FALTA SEGURO)
      this.loadVisitedPlaces(this.user.id); // <--- ¡IMPORTANTE!
    }
  }

  // --- Función para cargar los pines guardados ---
  loadVisitedPlaces(userId: number) {
    this.tripService.getVisitedPlaces(userId).subscribe({
      next: (places) => {
        // Añadimos los pines guardados al mapa
        places.forEach(p => {
          this.tripMarkers.push({
            position: { lat: p.latitude, lng: p.longitude },
            title: p.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // Icono azul para diferenciar
          });
        });
      },
      error: (err) => console.error("Error cargando pines:", err)
    });
  }

  // Carga tus viajes normales (rojos)
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
            icon: null // Rojo por defecto
          });
        }
      });
    });
  }

  // Función para añadir nuevos (y guardarlos)
  addPlace() {
    if (!this.newPlaceName.trim()) return;

    this.geocoder.geocode({ address: this.newPlaceName }).subscribe(({ results }) => {
      if (results && results.length) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();

        // Objeto a guardar
        const newPin = {
            userId: this.user.id, // Asegúrate de que user.id no sea null
            name: this.newPlaceName,
            latitude: lat,
            longitude: lng
        };

        // Guardar en Backend
        this.tripService.addVisitedPlace(newPin).subscribe({
            next: () => {
                // Pintar en el mapa tras guardar
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

  // ... Resto de métodos (openEditModal, etc.)
  openEditModal() { this.isEditModalOpen = true; }
  closeEditModal() { this.isEditModalOpen = false; }
  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
  }
  setActiveTab(tab: string) { this.activeTab = tab; }
}