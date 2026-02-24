import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; 

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
  activeTab: string = 'my-friends';

  // Listas "Brutas" (Todos los datos)
  allMyFriends: UserUI[] = [];      
  allExploreUsers: UserUI[] = [];   

  // Listas "Filtradas" (Lo que se ve en pantalla)
  filteredFriends: UserUI[] = [];
  filteredExplore: UserUI[] = []; 
  
  searchTerm: string = '';
  isLoading: boolean = false;
  currentUser: any = null;

  chatFriend: UserUI | null = null; 

  // MODAL DE BORRADO
  showDeleteModal: boolean = false;
  friendToDelete: UserUI | null = null;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private route: ActivatedRoute 
  ) {}

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) this.currentUser = JSON.parse(userStr);
    }
    
    if (this.currentUser) {
      this.loadInitialData();
    }
  }

  loadInitialData() {
    this.isLoading = true;
    this.userService.getMyFriends(this.currentUser.id).subscribe({
      next: (friends) => {
        // 1. FILTRO DE ADMIN EN MIS AMIGOS
        this.allMyFriends = friends.filter(f => (f as any).role !== 'admin');
        
        // Inicializamos la lista filtrada
        this.filteredFriends = [...this.allMyFriends];

        this.checkUrlForChat();
        this.loadExploreUsers(); 
      },
      error: () => this.loadExploreUsers()
    });
  }

  checkUrlForChat() {
    this.route.queryParams.subscribe(params => {
      const friendId = params['chatWith'];
      if (friendId) {
        const friendToOpen = this.allMyFriends.find(f => f.id.toString() === friendId.toString());
        if (friendToOpen) {
          this.activeTab = 'my-friends'; 
          this.openChat(friendToOpen);   
        }
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    // Al cambiar de pestaña, limpiamos búsqueda o reaplicamos filtro si quieres
    // this.searchTerm = ''; 
    // this.filterUsers();
  }

  loadExploreUsers() {
    // isLoading ya estaba true desde loadInitialData o lo ponemos aquí si se llama aparte
    
    const myFriendIds = this.allMyFriends.map(f => f.id);

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.allExploreUsers = data
          .filter(u => 
            u.id !== this.currentUser?.id && 
            !myFriendIds.includes(u.id) && 
            (u as any).role !== 'admin' // FILTRO ADMIN EN EXPLORAR
          )
          .map(u => ({ ...u, requestStatus: 'none' }));
        
        this.filteredExplore = [...this.allExploreUsers];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // --- BUSCADOR UNIFICADO ---
  filterUsers() {
    const term = this.searchTerm.toLowerCase().trim();

    // Filtramos AMBAS listas a la vez
    this.filteredFriends = this.allMyFriends.filter(u => 
      u.userName.toLowerCase().includes(term)
    );

    this.filteredExplore = this.allExploreUsers.filter(u => 
      u.userName.toLowerCase().includes(term)
    );
  }

  // --- LÓGICA DE BORRADO DE AMIGOS ---
  openDeleteConfirm(friend: UserUI) {
    this.friendToDelete = friend;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.friendToDelete = null;
  }

  confirmDelete() {
    if (!this.friendToDelete || !this.currentUser) return;

    this.userService.deleteFriend(this.currentUser.id, this.friendToDelete.id).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.allMyFriends = this.allMyFriends.filter(f => f.id !== this.friendToDelete!.id);
        
        // Actualizar filtros y mover usuario a "Explorar" si se desea
        this.filterUsers();
        this.loadExploreUsers(); // Recargamos explorar para que aparezca allí de nuevo
        
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error("Error eliminando amigo", err);
        alert("Error al eliminar amigo."); // O usa un banner si prefieres
      }
    });
  }

  sendRequest(user: UserUI) {
    if (!this.currentUser) return;
    this.userService.sendFriendRequest(this.currentUser.id, user.id).subscribe({
      next: () => {
        user.requestStatus = 'pending';
      },
      error: (err) => {
        if (err.status === 409) user.requestStatus = 'pending';
      }
    });
  }
  
  openChat(friend: UserUI) {
    this.chatFriend = friend;
  }
  
  closeChat() {
    this.chatFriend = null;
  }
}