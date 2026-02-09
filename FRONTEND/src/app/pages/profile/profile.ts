import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para los inputs del modal
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  isEditModalOpen: boolean = false;
  activeTab: string = 'trips'; // 'trips' | 'photos' | 'map'

  // Datos simulados para rellenar el perfil profesional
  stats = {
    countries: 12,
    trips: 8,
    followers: 145
  };

  myTrips = [
    { title: 'Verano en Italia', date: 'Ago 2023', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2000' },
    { title: 'Escapada a Londres', date: 'Nov 2023', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2000' },
    { title: 'Ruta por Tailandia', date: 'Ene 2024', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2000' }
  ];

  constructor() {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    } else {
      // Usuario default por si no hay login
      this.user = {
        userName: 'Invitado',
        email: 'invitado@tripshare.com',
        bio: 'Amante de los viajes y la fotografía.',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
      };
    }
  }

  // --- Lógica del Modal de Edición ---
  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveProfile() {
    localStorage.setItem('user', JSON.stringify(this.user));
    this.closeEditModal();
    // Opcional: Recargar o mostrar notificación
  }

  // --- Lógica de Pestañas ---
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}