import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { 
  TripService, 
  Trip, 
  Activity, 
  Expense, 
  Memory,
  CreateActivityRequest,
  CreateExpenseRequest,
  CreateMemoryRequest
} from '../../services/trip.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './trip-detail.html',
  styleUrls: ['./trip-detail.css']
})
export class TripDetailComponent implements OnInit {
  tripId!: number;
  trip: Trip | null = null;
  currentUserId: number = 0; // Necesario para saber quién crea las cosas
  
  // Pestaña activa por defecto
  activeTab: 'itinerary' | 'expenses' | 'memories' = 'itinerary';

  // Datos
  activities: Activity[] = [];
  expenses: Expense[] = [];
  memories: Memory[] = [];

  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    // 1. Obtener mi ID de usuario
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUserId = JSON.parse(userStr).id;
      }
    }

    // 2. Leer el ID del viaje de la URL
    this.route.params.subscribe(params => {
      this.tripId = Number(params['id']);
      if (this.tripId) {
        this.loadTripData();
      }
    });
  }

  loadTripData() {
    this.isLoading = true;
    
    // Cargamos la info general del viaje
    this.tripService.getTripById(this.tripId).subscribe(tripData => {
      this.trip = tripData;
      
      // Cargamos el resto de datos en paralelo
      this.tripService.getActivities(this.tripId).subscribe(act => this.activities = act);
      this.tripService.getExpenses(this.tripId).subscribe(exp => this.expenses = exp);
      this.tripService.getMemories(this.tripId).subscribe(mem => {
        this.memories = mem;
        this.isLoading = false;
      });
    });
  }

  setTab(tab: 'itinerary' | 'expenses' | 'memories') {
    this.activeTab = tab;
  }

  // ==========================================
  // CONTROL DE MODALES Y FORMULARIOS
  // ==========================================
  showModal: boolean = false;
  modalType: 'activity' | 'expense' | 'memory' | null = null;

  // Modelos temporales para los formularios
  newActivity = { title: '', start: '', end: '' };
  newExpense = { description: '', amount: null };
  newMemory = { type: 'photo', description: '', url: '' };
  totalExpenses: number = 0;
  calculateTotal() {
    this.totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0);
  }
  // ABRIR MODAL
  openModal(type: 'activity' | 'expense' | 'memory') {
    this.modalType = type;
    this.showModal = true;
    
    // Reseteamos datos al abrir
    this.newActivity = { title: '', start: '', end: '' };
    this.newExpense = { description: '', amount: null };
    this.newMemory = { type: 'photo', description: '', url: '' };
  }

  // CERRAR MODAL
  closeModal() {
    this.showModal = false;
    this.modalType = null;
  }

  // ==========================================
  // GUARDAR DATOS (SAVE)
  // ==========================================

  saveActivity() {
    if (!this.newActivity.title || !this.newActivity.start) return alert("Rellena título y fecha inicio");

    const activityData: CreateActivityRequest = {
      tripId: this.tripId,
      title: this.newActivity.title,
      // Añadimos :00 al final porque el input type="datetime-local" no manda segundos
      startDatetime: this.newActivity.start + ':00', 
      endDatetime: this.newActivity.end ? this.newActivity.end + ':00' : this.newActivity.start + ':00',
      createdByUserId: this.currentUserId
    };

    this.tripService.addActivity(this.tripId, activityData).subscribe({
      next: (res) => {
        this.activities.push(res); // Actualizamos lista
        this.closeModal();         // Cerramos modal
      },
      error: (e) => alert("Error al guardar actividad")
    });
  }

  saveExpense() {
    if (!this.newExpense.description || !this.newExpense.amount) return alert("Rellena descripción y cantidad");

    const expenseData: CreateExpenseRequest = {
      description: this.newExpense.description,
      amount: Number(this.newExpense.amount),
      paidByUserId: this.currentUserId
    };

    this.tripService.addExpense(this.tripId, expenseData).subscribe({
      next: (res) => {
        this.expenses.push(res);
        this.calculateTotal(); // Recalcular total
        this.closeModal();
      },
      error: (e) => alert("Error al guardar gasto")
    });
  }

  saveMemory() {
    // Si es foto y no ponen URL, ponemos una aleatoria
    let finalUrl = this.newMemory.url;
    if (this.newMemory.type === 'photo' && !finalUrl) {
      finalUrl = `https://picsum.photos/seed/${Date.now()}/300/200`;
    }

    const memoryData: CreateMemoryRequest = {
      userId: this.currentUserId,
      type: this.newMemory.type,
      description: this.newMemory.description,
      mediaUrl: finalUrl
    };

    this.tripService.addMemory(this.tripId, memoryData).subscribe({
      next: (res) => {
        this.memories.push(res);
        this.closeModal();
      },
      error: (e) => alert("Error al guardar recuerdo")
    });
  }
}