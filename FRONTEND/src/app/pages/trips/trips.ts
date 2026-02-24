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
  
  // VARIABLE NUEVA PARA CONTROLAR EL MÍNIMO DEL FIN
  minEndDate: string = '';

  readonly DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  readonly BACKUP_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  
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
    }
  }

  openCreateModal() {
    this.errorMessage = ''; 
    this.showCreateModal = true;
    
    const today = new Date();
    const startDateString = today.toISOString().split('T')[0];
    
    // Calculamos el mínimo para la fecha fin (Hoy + 1 día)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    this.minEndDate = tomorrow.toISOString().split('T')[0];

    // Por defecto ponemos el fin a 3 días vista
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);
    const endDateString = futureDate.toISOString().split('T')[0];

    this.newTrip = { 
        name: '', 
        destination: '', 
        origin: '', 
        startDate: startDateString, 
        endDate: endDateString,
        imageUrl: this.DEFAULT_IMAGE 
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.errorMessage = '';
  }

  // --- LÓGICA DE FECHAS ACTUALIZADA ---
  onStartDateChange() {
    if (this.newTrip.startDate) {
      const start = new Date(this.newTrip.startDate);
      
      // Calculamos Start + 1 día
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + 1);
      
      // Actualizamos el mínimo permitido para el input HTML
      this.minEndDate = nextDay.toISOString().split('T')[0];

      // Si la fecha fin actual es menor que el nuevo mínimo, la empujamos
      if (this.newTrip.endDate < this.minEndDate) {
        this.newTrip.endDate = this.minEndDate;
      }
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type.match(/image\/*/)) {
      this.compressImage(file, 800, 0.7).then(compressedBase64 => {
        this.newTrip.imageUrl = compressedBase64;
      }).catch(err => {
        this.errorMessage = "Hubo un problema al procesar la imagen.";
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

  onImageError(event: any) {
    event.target.src = this.BACKUP_IMAGE;
  }

  saveNewTrip() {
    this.errorMessage = ''; 

    if (!this.newTrip.name || !this.newTrip.destination || !this.newTrip.startDate) {
      this.errorMessage = "Por favor rellena los campos obligatorios (*).";
      return;
    }

    if (!this.newTrip.imageUrl || this.newTrip.imageUrl.trim() === '') {
        this.newTrip.imageUrl = this.DEFAULT_IMAGE;
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
        this.errorMessage = "Hubo un error en el servidor al crear el viaje.";
      }
    });
  }
}