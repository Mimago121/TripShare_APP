/*import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TripService } from '../../services/trip.service';
import { Trip } from '../../interfaces/models/trip.model';

@Component({
  selector: 'trips',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './trips.html',
})
export class TripsComponent implements OnInit {
  private tripService = inject(TripService);
  private fb = inject(FormBuilder);

  trips: Trip[] = [];
  loading = false;
  error: string | null = null;

  isCreateOpen = false;
  submitting = false;

  // Form sencillo (los mínimos que normalmente pide backend)
  tripForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    destination: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', [Validators.required]], // tipo "YYYY-MM-DD"
    endDate: ['', [Validators.required]],   // tipo "YYYY-MM-DD"
  });

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.error = null;

    this.tripService.getTrips().subscribe({
      next: (data) => {
        this.trips = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los viajes (¿backend/proxy caído?).';
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.isCreateOpen = true;
    this.error = null;
  }

  closeCreate(): void {
    if (this.submitting) return;
    this.isCreateOpen = false;
    this.tripForm.reset();
  }

  createTrip(): void {
    this.error = null;

    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const dto = {
      name: this.tripForm.value.name!,
      destination: this.tripForm.value.destination!,
      startDate: this.tripForm.value.startDate!,
      endDate: this.tripForm.value.endDate!,
    };

    this.tripService.createTrip(dto as any).subscribe({
      next: (created) => {
        // lo metemos arriba para que se vea instantáneo
        this.trips = [created, ...this.trips];
        this.submitting = false;
        this.closeCreate();
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo crear el viaje. Revisa los campos y el backend.';
        this.submitting = false;
      }
    });
  }

  deleteTrip(id: number): void {
    this.error = null;

    const ok = confirm('¿Seguro que quieres borrar este viaje?');
    if (!ok) return;

    this.tripService.deleteTrip(id).subscribe({
      next: () => {
        this.trips = this.trips.filter(t => t.id !== id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo borrar el viaje.';
      }
    });
  }

  trackById(_: number, t: Trip) {
    return t.id;
  }
}
*/
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip } from '../../services/trip.service';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterModule], // Quitamos FormsModule
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  currentUser: any = null;
  isLoading: boolean = true;

  constructor(
    private tripService: TripService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        this.loadTrips(); // Solo llamamos a cargar cuando ya tenemos el usuario
      } else {
        this.isLoading = false;
      }
    }
  }

  loadTrips() {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.tripService.getMyTrips(this.currentUser.id).subscribe({
      next: (data) => {
        this.trips = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando viajes', err);
        this.isLoading = false;
      }
    });
  }

  goToDetail(tripId: number | undefined) {
    console.log("Intentando abrir viaje con ID:", tripId); // Para debugear
    
    if (tripId) {
      this.router.navigate(['/trip-detail', tripId]);
    } else {
      console.error("❌ ERROR: El ID del viaje es undefined. Revisa el backend.");
    }
  }
}