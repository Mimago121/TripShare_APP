import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { TripService, Trip, Activity, Expense, Memory } from '../../services/trip.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent,RouterModule],
  templateUrl: './trip-detail.html',
  styleUrls: ['./trip-detail.css']
})
export class TripDetailComponent implements OnInit {
  tripId!: number;
  trip: Trip | null = null;
  
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
    // Leemos el ID de la URL
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
      
      // Cargamos el resto de datos
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
}