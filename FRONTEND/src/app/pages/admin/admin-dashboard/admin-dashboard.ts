import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar';
import { FooterComponent } from "../../footer/footer";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  
  usersData: any[] = [];
  isLoading = true;
  stats = {
    totalUsers: 0,
    totalTrips: 0,
    admins: 0
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      this.router.navigate(['/trips']); // Si no es admin, a sus viajes
      return;
    }
  }
  this.loadAdminData();
}

  loadAdminData() {
  this.http.get<any[]>('http://localhost:8080/admin/dashboard').subscribe({
    next: (data) => {
      // FILTRO: Solo dejamos a los que tienen rol 'user'
      this.usersData = data.filter(u => u.role === 'user');
      this.calculateStats();
      this.isLoading = false;
    },
    error: (err) => {
      console.error("Error cargando dashboard:", err);
      this.isLoading = false;
    }
  });
}

  calculateStats() {
    this.stats.totalUsers = this.usersData.length;
    this.stats.totalTrips = this.usersData.reduce((acc, user) => acc + user.trips.length, 0);
    this.stats.admins = this.usersData.filter(u => u.role === 'admin').length;
  }
}