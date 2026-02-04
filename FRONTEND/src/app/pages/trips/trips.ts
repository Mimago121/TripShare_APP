import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';

import { TripsService } from '../../services/TripsService';
import { AuthService } from '../../services/auth.service';

// Modelos UI / Domain
import { TripCard } from '../../interfaces/ui/trip-card.model';
import { MemberMini } from '../../interfaces/ui/member-mini.model';

// DTO de request (lo que mandas al backend al crear)
import { CreateTripRequest } from '../../interfaces/api/create-trip.request';

// Firebase User (solo si seguís usando Firebase Auth para identificar al usuario)
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-trips-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css'],
})
export class TripsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tripsService = inject(TripsService);
  private router = inject(Router);

  myTrips: Trip[] = [];
  pendingTrips: Trip[] = [];
  
  templates: any[] = []; 
  loading = true;
  errorMsg = '';

  isCreateOpen = false;
  showTemplateSelection = true;
  submitting = false;

  tripForm!: FormGroup;

  currentUser: MemberMini | null = null;

  // Plantillas (si las sigues usando)
  templates: any[] = [];

  // Notificaciones (si las lleváis a backend luego; de momento lo dejamos apagado)
  hasNotifications = false;
  notificationCount = 0;

  readonly defaultUserAvatar =
    'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  readonly fallbackTripImg =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80';

  ngOnInit(): void {
    // 1) Formulario: solo UI + validadores
    this.tripForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        origin: ['', [Validators.required, Validators.minLength(2)]],
        destination: ['', [Validators.required, Validators.minLength(2)]],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        imageUrl: [''],
      },
      { validators: [this.dateRangeValidator, this.originDestinationValidator] }
    );

    // 2) Escuchar al usuario logueado
    //    (Esto sirve para saber a quién pedirle sus viajes)
    this.authService.user$.subscribe((user: User | null) => {
      if (!user) {
        this.currentUser = null;
        this.myTrips = [];
        this.pendingTrips = [];
        return;
      }

      this.currentUser = {
        id: Number.NaN as any, // OJO: si tu MemberMini usa number, aquí no encaja con uid (string).
        // Te explico abajo cómo arreglarlo bien.
        name: user.displayName || user.email?.split('@')[0] || 'Viajero',
        avatarUrl: user.photoURL || this.defaultUserAvatar,
      };

      // 3) Cargar datos desde backend
      this.loadTrips();
      this.loadTemplates(); // opcional si tienes endpoint
    });
  }

  /**
   * Pide al backend los viajes del usuario y los separa en:
   * - myTrips (aceptados)
   * - pendingTrips (pendientes)
   *
   * Aquí es donde el componente "recibe" los datos:
   * realmente los recibe dentro del subscribe.
   */
  loadTrips(): void {
    this.loading = true;
    this.errorMsg = '';

    this.tripsService.getMyTripsAndPending().subscribe({
      next: (res) => {
        this.myTrips = res.myTrips;
        this.pendingTrips = res.pendingTrips;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando viajes:', err);
        this.errorMsg = 'No se pudieron cargar tus viajes.';
        this.loading = false;
      },
    });
  }

  /**
   * Plantillas: idealmente vienen de backend (GET /trip-templates).
   * Si aún no lo tienes, puedes dejarlo vacío o hardcodear en local.
   */
  loadTemplates(): void {
    this.tripsService.getTripTemplates().subscribe({
      next: (templates) => (this.templates = templates),
      error: (err) => console.warn('No pude cargar plantillas:', err),
    });
  }

  goToChats(): void {
    this.router.navigate(['/chats']);
  }

  openCreate(): void {
    this.errorMsg = '';
    this.isCreateOpen = true;
    this.showTemplateSelection = true;
    this.tripForm.reset();
  }

  selectTemplate(template: any | null): void {
    this.showTemplateSelection = false;

    if (template) {
      this.tripForm.patchValue({
        destination: template.destination,
        name: template.description || `Viaje a ${template.destination}`,
        imageUrl: template.imageUrl,
      });
    } else {
      this.tripForm.reset();
    }
  }

  closeCreate(): void {
    if (this.submitting) return;
    this.isCreateOpen = false;
  }

  onOverlayClick(evt: MouseEvent): void {
    const target = evt.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeCreate();
    }
  }

  // ---------- ACCIONES (aceptar/rechazar) ----------
  acceptInvite(trip: TripCard): void {
    this.tripsService.acceptInvite(trip.id).subscribe({
      next: () => this.loadTrips(),
      error: (e) => console.error('Error al aceptar invitación', e),
    });
  }

  rejectInvite(trip: TripCard): void {
    if (!confirm(`¿Rechazar invitación a ${trip.destination}?`)) return;

    this.tripsService.rejectInvite(trip.id).subscribe({
      next: () => this.loadTrips(),
      error: (e) => console.error('Error al rechazar invitación', e),
    });
  }

  // ---------- CREACIÓN ----------
  createTrip(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const v = this.tripForm.value;

    // Esto es lo que mandas al backend (DTO de request)
    const dto: CreateTripRequest = {
      name: v.name.trim(),
      origin: v.origin.trim(),
      destination: v.destination.trim(),
      startDate: v.startDate,
      endDate: v.endDate,
      imageUrl: v.imageUrl?.trim() || null,
    };

    this.tripsService.createTrip(dto).subscribe({
      next: () => {
        this.submitting = false;
        this.isCreateOpen = false;
        this.tripForm.reset();
        this.loadTrips(); // recargar lista tras crear
      },
      error: (err) => {
        console.error('Error creando viaje:', err);
        this.submitting = false;
        this.errorMsg = 'No se pudo crear el viaje.';
      },
    });
  }

  // Helpers UI (igual que tenías)
  getTripImage(trip: TripCard): string {
    return trip.imageUrl || this.fallbackTripImg;
  }

  formatDateRange(startIso: string, endIso: string): string {
    const s = this.formatIsoDate(startIso);
    const e = this.formatIsoDate(endIso);
    return `${s} - ${e}`;
  }

  private formatIsoDate(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  visibleMembers(trip: TripCard): MemberMini[] {
    return trip.members ? trip.members.slice(0, 3) : [];
  }

  extraMembersCount(trip: TripCard): number {
    return trip.members ? Math.max(0, trip.members.length - 3) : 0;
  }

  // Validadores
  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) return null;
    return end >= start ? null : { dateRange: true };
  }

  private originDestinationValidator(group: AbstractControl): ValidationErrors | null {
    const o = (group.get('origin')?.value || '').trim().toLowerCase();
    const d = (group.get('destination')?.value || '').trim().toLowerCase();
    if (!o || !d) return null;
    return o !== d ? null : { samePlace: true };
  }
}
