import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';

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
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    history.pushState(null, '', window.location.href);

    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        
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

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    const confirmacion = confirm('¿Seguro que quieres abandonar la aplicación y cerrar sesión? ✈️');

    if (confirmacion) {
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
    
    // 1. Calcular la fecha de hoy
    const today = new Date();
    const startDateString = today.toISOString().split('T')[0];
    
    // 2. Calcular la fecha de hoy + 3 días
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);
    const endDateString = futureDate.toISOString().split('T')[0];

    // 3. Rellenar formulario por defecto
    this.newTrip = { 
        name: '', 
        destination: '', 
        origin: '', 
        startDate: startDateString, 
        endDate: endDateString,
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' 
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  // ==========================================
  // LÓGICA INTELIGENTE DE FECHAS
  // ==========================================
  onStartDateChange() {
    if (this.newTrip.startDate) {
      const start = new Date(this.newTrip.startDate);
      const end = new Date(this.newTrip.endDate);

      // Si no hay fecha fin, o la fecha fin se ha quedado por detrás (o igual) a la de inicio
      if (!this.newTrip.endDate || end <= start) {
        // Le sumamos 1 día automático a la fecha de inicio
        const nextDay = new Date(start);
        nextDay.setDate(start.getDate() + 1);
        this.newTrip.endDate = nextDay.toISOString().split('T')[0];
      }
    }
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