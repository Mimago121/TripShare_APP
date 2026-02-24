import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar';
import { FooterComponent } from "../../footer/footer";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  
  usersData: any[] = [];
  filteredUsers: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  currentUser: any = null;

  // ACTUALIZADO: Cambiamos 'admins' por 'uniqueDestinations'
  stats = {
    totalUsers: 0,
    totalTrips: 0,
    uniqueDestinations: 0 
  };

  showModal: boolean = false;
  modalType: string = ''; 
  deleteType: string = ''; 
  
  selectedUser: any = {};
  selectedTrip: any = {};
  itemToDelete: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      if (this.currentUser.role !== 'admin') {
        this.router.navigate(['/trips']); 
        return;
      }
    }
    this.loadAdminData();
  }

  loadAdminData() {
    this.isLoading = true;
    this.http.get<any[]>('http://localhost:8080/admin/dashboard').subscribe({
      next: (data) => {
        // Filtramos al propio admin logueado de la lista visual
        this.usersData = data.filter(u => u.id !== this.currentUser.id);
        this.filteredUsers = [...this.usersData];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error cargando dashboard:", err);
        this.isLoading = false;
      }
    });
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.usersData.filter(u => 
      u.userName.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  }

  // --- LÓGICA DE ESTADÍSTICAS ACTUALIZADA ---
  calculateStats() {
    // 1. Usuarios: Contamos SOLO los que tienen rol 'user' (sin sumar el +1 del admin)
    this.stats.totalUsers = this.usersData.filter(u => u.role === 'user').length;

    // 2. Viajes Totales: Suma de todos los viajes de todos los usuarios
    this.stats.totalTrips = this.usersData.reduce((acc, user) => acc + user.trips.length, 0);

    // 3. Destinos Únicos: Extraemos todos los destinos y contamos los únicos
    // (Ej: Si dos usuarios van a "París", cuenta como 1 destino global)
    const allDestinations = this.usersData.flatMap(user => user.trips.map((t: any) => t.destination));
    const uniqueSet = new Set(allDestinations.map((d: string) => d.toLowerCase().trim()));
    this.stats.uniqueDestinations = uniqueSet.size;
  }

  // ... (Resto de funciones: openEditUser, saveTrip, etc. se mantienen IGUAL) ...
  
  openEditUser(user: any) {
    this.selectedUser = { ...user };
    this.modalType = 'edit-user';
    this.showModal = true;
  }

  saveUser() {
    const cleanUser = {
        id: this.selectedUser.id,
        email: this.selectedUser.email,
        userName: this.selectedUser.userName,
        avatarUrl: this.selectedUser.avatarUrl || null,
        bio: this.selectedUser.bio || null,
        provider: this.selectedUser.provider || 'local',
        createdAt: this.selectedUser.createdAt || new Date().toISOString(),
        role: this.selectedUser.role
    };

    this.http.put(`http://localhost:8080/users/${this.selectedUser.id}`, cleanUser, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.loadAdminData();
          this.closeModal();
        },
        error: (err) => console.error("Error actualizando usuario", err)
      });
  }

  confirmDeleteUser(user: any) {
    this.itemToDelete = user;
    this.deleteType = 'user';
    this.modalType = 'delete-confirm';
    this.showModal = true;
  }

  openEditTrip(trip: any) {
    this.selectedTrip = { ...trip };
    if (trip.startDate) this.selectedTrip.startDate = trip.startDate.split('T')[0];
    if (trip.endDate) this.selectedTrip.endDate = trip.endDate.split('T')[0];
    
    this.modalType = 'edit-trip';
    this.showModal = true;
  }

  saveTrip() {
    const cleanTrip = {
      name: this.selectedTrip.name,
      destination: this.selectedTrip.destination,
      origin: this.selectedTrip.origin || null,
      startDate: this.selectedTrip.startDate,
      endDate: this.selectedTrip.endDate,
      imageUrl: this.selectedTrip.imageUrl || null
    };

    this.http.put(`http://localhost:8080/trips/${this.selectedTrip.id}`, cleanTrip, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.loadAdminData();
          this.closeModal();
        },
        error: (err) => console.error("Error actualizando viaje", err)
      });
  }

  confirmDeleteTrip(trip: any) {
    this.itemToDelete = trip;
    this.deleteType = 'trip';
    this.modalType = 'delete-confirm';
    this.showModal = true;
  }

  executeDelete() {
    if (this.deleteType === 'user') {
      this.http.delete(`http://localhost:8080/users/${this.itemToDelete.id}`, { responseType: 'text' })
        .subscribe({
          next: () => { this.loadAdminData(); this.closeModal(); },
          error: (err) => console.error("Error borrando usuario", err)
        });

    } else if (this.deleteType === 'trip') {
      this.http.delete(`http://localhost:8080/trips/${this.itemToDelete.id}`, { responseType: 'text' })
        .subscribe({
          next: () => { this.loadAdminData(); this.closeModal(); },
          error: (err) => console.error("Error borrando viaje", err)
        });
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = {};
    this.selectedTrip = {};
    this.itemToDelete = null;
  }
}