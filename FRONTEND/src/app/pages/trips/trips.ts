import { Component, OnInit, HostListener } from '@angular/core'; // <-- AÑADIDO HostListener
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service'; // <-- AÑADIDO AuthService

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  currentUser: any = null;
  isLoading: boolean = true;
  showCreateModal: boolean = false;
  
  newTrip = {
    name: '',
    destination: '',
    origin: '',
    startDate: '',
    endDate: '',
    imageUrl: '' 
  };

  constructor(
    private tripService: TripService,
    private authService: AuthService, // <-- INYECTADO
    private router: Router
  ) {}

  ngOnInit(): void {
    // TRUCO: Metemos un estado falso en el historial del navegador para "atrapar" la flecha de atrás
    history.pushState(null, '', window.location.href);

    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        
        // PROTECCIÓN: Si es admin, no puede estar aquí
        if (this.currentUser.role === 'admin') {
          this.router.navigate(['/admin']);
          return;
        }

        this.loadTrips();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  // =========================================================
  // ESTO DETECTA CUANDO PULSAS LA FLECHA DE ATRÁS DEL NAVEGADOR
  // =========================================================
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    const confirmacion = confirm('¿Seguro que quieres abandonar la aplicación y cerrar sesión? ✈️');

    if (confirmacion) {
      // Si dice que SÍ, cerramos sesión de verdad
      this.authService.logout().subscribe({
        next: () => {
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        },
        error: () => {
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        }
      });
    } else {
      // Si dice que NO, volvemos a bloquear la flecha para que se quede en la página
      history.pushState(null, '', window.location.href);
    }
  }

  loadTrips() {
    if (!this.currentUser) return;
    this.tripService.getMyTrips(this.currentUser.id).subscribe({
      next: (data) => {
        this.trips = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  goToDetail(tripId: number | undefined) {
    if (tripId) {
      this.router.navigate(['/trip-detail', tripId]);
    } else {
      console.error("No se puede navegar: El ID del viaje es undefined");
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newTrip = { 
        name: '', 
        destination: '', 
        origin: '', 
        startDate: '', 
        endDate: '',
        imageUrl: '' 
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  saveNewTrip() {
    if (!this.newTrip.name || !this.newTrip.destination || !this.newTrip.startDate) {
      alert("Por favor rellena los campos obligatorios (*)");
      return;
    }

    const tripPayload = {
      ...this.newTrip,
      createdByUserId: this.currentUser.id
    };

    this.tripService.createTrip(tripPayload).subscribe({
      next: (createdTrip) => {
        alert(`¡Viaje a ${createdTrip.destination} creado!`);
        this.closeCreateModal();
        this.trips.push(createdTrip); 
      },
      error: (err) => {
        console.error(err);
        alert("Error al crear el viaje. Revisa la consola.");
      }
    });
  }
}