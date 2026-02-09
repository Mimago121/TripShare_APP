import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/models/user.model';

interface UserUI extends User {
  requestStatus?: 'none' | 'pending' | 'friend';
}

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule],
  templateUrl: './friends.html',
  styleUrls: ['./friends.css']
})
export class FriendsComponent implements OnInit {
  // Pestaña activa: 'my-friends' o 'explore'
  activeTab: string = 'my-friends';

  myFriends: UserUI[] = [];      // Lista de amigos ya aceptados
  exploreUsers: UserUI[] = [];   // Lista de gente para agregar
  filteredExplore: UserUI[] = []; // Para el buscador
  
  searchTerm: string = '';
  isLoading: boolean = false;
  currentUser: any = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) this.currentUser = JSON.parse(userStr);
    }
    
    // Primero cargamos amigos, y CUANDO TERMINEN, cargamos el resto
    if (this.currentUser) {
      this.userService.getMyFriends(this.currentUser.id).subscribe({
        next: (friends) => {
          this.myFriends = friends;
          this.loadExploreUsers(); // Ahora sí podemos filtrar
        },
        error: () => this.loadExploreUsers() // Si falla, cargamos todos igual
      });
    }
  }

  // Cambiar de pestaña
  setTab(tab: string) {
    this.activeTab = tab;
  }

  // CARGAR AMIGOS REALES
  loadMyFriends() {
    if (!this.currentUser) return;
    this.userService.getMyFriends(this.currentUser.id).subscribe({
      next: (friends) => this.myFriends = friends,
      error: (e) => console.error('Error cargando amigos', e)
    });
  }

  // CARGAR RESTO DE USUARIOS (EXPLORAR)
 loadExploreUsers() {
    this.isLoading = true;
    
    // Primero necesitamos saber quiénes son mis amigos
    // (Aseguramos que myFriends esté cargado o lo usamos aquí)
    const myFriendIds = this.myFriends.map(f => f.id);

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.exploreUsers = data
          .filter(u => 
            u.id !== this.currentUser?.id && // No mostrarme a mí mismo
            !myFriendIds.includes(u.id)      // No mostrar a mis amigos actuales
          )
          .map(u => ({ 
            ...u, 
            requestStatus: 'none' 
          }));
        
        this.filteredExplore = [...this.exploreUsers];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  sendRequest(user: UserUI) {
    if (!this.currentUser) return;
    this.userService.sendFriendRequest(this.currentUser.id, user.id).subscribe({
      next: () => {
        user.requestStatus = 'pending';
        alert(`Solicitud enviada a ${user.userName}`);
      },
      error: (err) => {
        if (err.status === 409) {
          user.requestStatus = 'pending';
          alert('Ya habías enviado solicitud a este usuario.');
        }
      }
    });
  }

  filterUsers() {
    this.filteredExplore = this.exploreUsers.filter(u => 
      u.userName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}