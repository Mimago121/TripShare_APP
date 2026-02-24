import { Component, OnInit, HostListener, ViewChild, ElementRef, NgZone } from '@angular/core';
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
  
  errorMessage: string = '';
  
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
    private router: Router,
    private ngZone: NgZone
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

  @ViewChild('destinationInput') set destinationInput(el: ElementRef) {
    if (el && typeof google !== 'undefined' && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(el.nativeElement, {
        types: ['(cities)'], 
        fields: ['formatted_address', 'name']
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          this.newTrip.destination = place.formatted_address || place.name || '';
        });
      });
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
    this.errorMessage = ''; 
    this.showCreateModal = true;
    
    const today = new Date();
    const startDateString = today.toISOString().split('T')[0];
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);
    const endDateString = futureDate.toISOString().split('T')[0];

    // Iniciamos la imagen vacía para que el usuario suba la suya
    this.newTrip = { 
        name: '', 
        destination: '', 
        origin: '', 
        startDate: startDateString, 
        endDate: endDateString,
        imageUrl: '' 
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.errorMessage = '';
  }

  onStartDateChange() {
    if (this.newTrip.startDate) {
      const start = new Date(this.newTrip.startDate);
      const end = new Date(this.newTrip.endDate);

      if (!this.newTrip.endDate || end <= start) {
        const nextDay = new Date(start);
        nextDay.setDate(start.getDate() + 1);
        this.newTrip.endDate = nextDay.toISOString().split('T')[0];
      }
    }
  }

  // --- NUEVA LÓGICA: SELECCIÓN Y COMPRESIÓN DE IMAGEN DESDE EL PC ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type.match(/image\/*/)) {
      // Comprimimos la imagen a 800px y 70% de calidad para no saturar la Base de Datos
      this.compressImage(file, 800, 0.7).then(compressedBase64 => {
        this.newTrip.imageUrl = compressedBase64;
      }).catch(err => {
        this.errorMessage = "Hubo un problema al procesar la imagen.";
        console.error(err);
      });
    } else {
      this.errorMessage = "Por favor, selecciona un archivo de imagen válido.";
    }
  }

  compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
             reject(new Error("Error procesando el Canvas"));
          }
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  saveNewTrip() {
    this.errorMessage = ''; 

    if (!this.newTrip.name || !this.newTrip.destination || !this.newTrip.startDate) {
      this.errorMessage = "Por favor rellena los campos obligatorios (*).";
      return;
    }

    const tripPayload = {
      ...this.newTrip,
      createdByUserId: this.currentUser.id
    };

    this.tripService.createTrip(tripPayload).subscribe({
      next: (createdTrip) => {
        this.closeCreateModal();
        this.trips.push(createdTrip); 
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Hubo un error en el servidor al crear el viaje. Inténtalo de nuevo.";
      }
    });
  }
}