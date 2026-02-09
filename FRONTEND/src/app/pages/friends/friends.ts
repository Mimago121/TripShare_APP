import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; // <--- IMPORTANTE: Para leer la URL

import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/models/user.model';
import { ChatComponent } from '../chat/chat';

interface UserUI extends User {
  requestStatus?: 'none' | 'pending' | 'friend';
}

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, FormsModule, ChatComponent],
  templateUrl: './friends.html',
  styleUrls: ['./friends.css']
})
export class FriendsComponent implements OnInit {
  // Pestaña activa: 'my-friends' o 'explore'
  activeTab: string = 'my-friends'; // Cambiado String -> string (tipo primitivo es mejor)

  myFriends: UserUI[] = [];      // Lista de amigos ya aceptados
  exploreUsers: UserUI[] = [];   // Lista de gente para agregar
  filteredExplore: UserUI[] = []; // Para el buscador
  
  searchTerm: string = '';
  isLoading: boolean = false;
  currentUser: any = null;

  chatFriend: UserUI | null = null; // El amigo con el que hablas

  constructor(
    private userService: UserService,
    private route: ActivatedRoute // <--- INYECTADO
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) this.currentUser = JSON.parse(userStr);
    }
    
    // Carga inicial
    if (this.currentUser) {
      this.loadInitialData();
    }
  }

  // Carga coordinada: Primero amigos -> Luego revisar URL -> Luego Explorar
  loadInitialData() {
    this.userService.getMyFriends(this.currentUser.id).subscribe({
      next: (friends) => {
        this.myFriends = friends;
        
        // 1. AHORA QUE TENEMOS AMIGOS, REVISAMOS SI HAY QUE ABRIR CHAT
        this.checkUrlForChat();

        // 2. Cargamos el resto de usuarios para "Explorar"
        this.loadExploreUsers(); 
      },
      error: () => this.loadExploreUsers()
    });
  }

  // 👇 LÓGICA NUEVA: Abrir chat si la URL lo dice (?chatWith=5)
  checkUrlForChat() {
    this.route.queryParams.subscribe(params => {
      const friendId = params['chatWith'];
      
      if (friendId) {
        // Buscamos al amigo en la lista cargada (convirtiendo ID a número por si acaso)
        const friendToOpen = this.myFriends.find(f => f.id == friendId);
        
        if (friendToOpen) {
          this.activeTab = 'my-friends'; // Aseguramos estar en la pestaña correcta
          this.openChat(friendToOpen);   // ¡ABRIMOS CHAT!
        }
      }
    });
  }

  // Cambiar de pestaña
  setTab(tab: string) {
    this.activeTab = tab;
  }

  // CARGAR RESTO DE USUARIOS (EXPLORAR)
  loadExploreUsers() {
    this.isLoading = true;
    
    // Sacamos los IDs de mis amigos para no mostrarlos en "Explorar"
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
  
  openChat(friend: UserUI) {
    this.chatFriend = friend;
  }
  
  closeChat() {
    this.chatFriend = null;
    // Opcional: Limpiar la URL para que si recargas no se vuelva a abrir solo
    // window.history.replaceState({}, '', '/friends'); 
  }
}