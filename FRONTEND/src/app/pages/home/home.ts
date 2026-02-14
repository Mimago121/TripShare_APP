import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService } from '../../services/trip.service'; // Asegúrate de importar esto

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = 'Viajero';
  currentUserId: number | null = null;
  
  // AQUÍ GUARDAMOS LOS VIAJES REALES DE LA BASE DE DATOS
  myTrips: any[] = []; 
  isLoading: boolean = false;

  // ESTO NO LO TOCAMOS (Destinos populares visuales)
  popularDestinations = [
    { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000' },
    { name: 'Nueva York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070' },
    { name: 'Roma', country: 'Italia', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996' },
    { name: 'Santorini', country: 'Grecia', image: 'https://images.unsplash.com/photo-1613395877344-13d4c2ce5d4d?q=80&w=2070' }
  ];

  // ESTO NO LO TOCAMOS (Testimonios)
  testimonials = [
    { name: 'Lucia Gómez', comment: 'TripShare es la app que siempre soñé. Por fin dejamos de usar Excel.', avatar: 'https://i.pravatar.cc/150?u=marta' },
    { name: 'Pablo Ruiz', comment: 'La mejor forma de tener todos los billetes y la ruta en un solo sitio.', avatar: 'https://i.pravatar.cc/150?u=pablo' },
    { name: 'Manolo Sánchez', comment: 'Organizamos nuestro viaje a Italia en una tarde. Magia pura.', avatar: 'https://i.pravatar.cc/150?u=iker' }
  ];

  constructor(private tripService: TripService) {}

  ngOnInit(): void {
    // 1. Verificar si hay usuario en localStorage
    if (typeof localStorage !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.isLoggedIn = true;
        this.userName = user.user_name || user.userName || user.name; // Intenta varios nombres por si acaso
        this.currentUserId = user.id || user.user_id;

        // 2. Cargar viajes reales
        if (this.currentUserId) {
          this.loadUserTrips(this.currentUserId);
        }
      }
    }
  }

  loadUserTrips(userId: number) {
    this.isLoading = true;
    // Asumimos que tienes este método en tu servicio. Si no, avísame.
    this.tripService.getTripsByUserId(userId).subscribe({
      next: (data) => {
        this.myTrips = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error cargando viajes:", err);
        this.isLoading = false;
      }
    });
  }

  scrollToFeatures() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}