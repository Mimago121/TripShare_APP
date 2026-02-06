import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  user: any = null;
  trips: any[] = [];
  isLoading = true;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
  const userData = localStorage.getItem('user');
  if (userData) {
    this.user = JSON.parse(userData);
    console.log('Usuario logueado:', this.user);
    
    // IMPORTANTE: Llamamos a la carga de viajes si hay usuario
    this.loadUserTrips(); 
  } else {
    this.router.navigate(['/login']);
  }
}

  loadUserTrips() {
    this.http.get<any[]>(`http://localhost:8080/trips/user/${this.user.id}`)
      .subscribe({
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

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  createNewTrip() {
    // Aquí podrías abrir un modal o navegar a /new-trip
    console.log('Crear nuevo viaje');
  }

  goToTrip(id: number) {
    this.router.navigate(['/trips', id]);
  }
}