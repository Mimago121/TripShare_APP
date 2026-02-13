import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip, Member } from '../../services/trip.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './trip-detail.html',
  styleUrls: ['./trip-detail.css']
})
export class TripDetailComponent implements OnInit {
  trip: Trip | null = null;
  activities: any[] = [];
  expenses: any[] = [];
  memories: any[] = [];
  members: any[] = []; 
  myFriends: Member[] = []; 
  
  tripId!: number;
  currentUserId: number | null = null;
  activeTab: string = 'itinerary';
  isLoading: boolean = true;
  totalExpenses: number = 0;

  // --- VARIABLES PARA LOS FORMULARIOS Y MODALES ---
  showModal: boolean = false;
  modalType: string = '';
  selectedFriendEmail: string = '';

  newActivity = { title: '', start: '', end: '' };
  newExpense = { description: '', amount: 0 };
  newMemory = { type: 'photo', description: '', url: '' };

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUserId = JSON.parse(userStr).id;
      }
    }

    this.route.params.subscribe(params => {
      this.tripId = Number(params['id']);
      if (this.tripId) {
        this.loadTripData();
        this.loadFriends();
      }
    });
  }

  loadTripData() {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (data) => {
        this.trip = data;
        this.tripService.getActivities(this.tripId).subscribe(a => this.activities = a);
        this.tripService.getExpenses(this.tripId).subscribe(e => {
          this.expenses = e;
          this.calculateTotal();
        });
        this.tripService.getMemories(this.tripId).subscribe(m => this.memories = m);
        this.tripService.getMembers(this.tripId).subscribe(mem => this.members = mem);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadFriends() {
    if (this.currentUserId) {
      this.tripService.getMyFriends(this.currentUserId).subscribe(f => this.myFriends = f);
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  calculateTotal() {
    this.totalExpenses = this.expenses.reduce((sum, item) => sum + item.amount, 0);
  }

  // --- MÉTODOS DEL MODAL ---
  openModal(type: string) {
    this.modalType = type;
    this.showModal = true;
    // Reset de formularios al abrir
    this.newActivity = { title: '', start: '', end: '' };
    this.newExpense = { description: '', amount: 0 };
    this.newMemory = { type: 'photo', description: '', url: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  // --- MÉTODOS DE GUARDADO (SAVE) ---
  saveActivity() {
    const data = { 
      ...this.newActivity, 
      tripId: this.tripId, 
      createdByUserId: this.currentUserId,
      startDatetime: this.newActivity.start,
      endDatetime: this.newActivity.end || this.newActivity.start
    };
    this.tripService.addActivity(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  saveExpense() {
    const data = { 
      ...this.newExpense, 
      paidByUserId: this.currentUserId 
    };
    this.tripService.addExpense(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  saveMemory() {
    const data = { 
      ...this.newMemory, 
      userId: this.currentUserId,
      mediaUrl: this.newMemory.url 
    };
    this.tripService.addMemory(this.tripId, data as any).subscribe(() => {
      this.loadTripData();
      this.closeModal();
    });
  }

  inviteSelectedFriend() {
    if (!this.selectedFriendEmail) return;
    this.tripService.inviteMember(this.tripId, this.selectedFriendEmail).subscribe({
      next: () => {
        this.selectedFriendEmail = '';
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = m);
      }
    });
  }

  inviteByEmail() {
    const email = prompt("Email del invitado:");
    if (email) {
      this.tripService.inviteMember(this.tripId, email).subscribe(() => {
        this.tripService.getMembers(this.tripId).subscribe(m => this.members = m);
      });
    }
  }
}