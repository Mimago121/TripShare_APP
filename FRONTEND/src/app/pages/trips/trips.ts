import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip } from '../../services/trip.service';

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

  // Variables para el Modal de Crear
  showCreateModal: boolean = false;
  newTrip = {
    name: '',
    destination: '',
    origin: '',
    startDate: '',
    endDate: ''
  };

  constructor(private tripService: TripService, private router: Router) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        this.loadTrips();
      } else {
        this.router.navigate(['/login']);
      }
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
  // --- MÉTODOS DE CREACIÓN ---

  openCreateModal() {
    this.showCreateModal = true;
    // Reseteamos el formulario
    this.newTrip = { name: '', destination: '', origin: '', startDate: '', endDate: '' };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  saveNewTrip() {
    if (!this.newTrip.name || !this.newTrip.destination || !this.newTrip.startDate) {
      alert("Por favor rellena los campos obligatorios (*)");
      return;
    }

    // Preparamos el objeto para el Backend
    const tripPayload = {
      ...this.newTrip,
      createdByUserId: this.currentUser.id // ¡Importante!
    };

    this.tripService.createTrip(tripPayload).subscribe({
      next: (createdTrip) => {
        alert(`¡Viaje a ${createdTrip.destination} creado!`);
        this.closeCreateModal();
        // Añadimos el nuevo viaje a la lista visualmente (o recargamos)
        this.trips.push(createdTrip); 
      },
      error: (err) => {
        console.error(err);
        alert("Error al crear el viaje. Revisa la consola.");
      }
    });
  }
}