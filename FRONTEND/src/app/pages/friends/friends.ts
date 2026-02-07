import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service'; // Asegúrate de que la ruta es correcta
import { User } from '../../interfaces/models/user.model'; // Asegúrate de que la ruta es correcta
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent], // <--- Importamos tus componentes
  templateUrl: './friends.html',
  styleUrls: ['./friends.css']
})
export class FriendsComponent implements OnInit {
  users: User[] = [];
  isLoading = true; // Para mostrar un mensaje de carga

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error conectando con Ktor:', err);
        this.isLoading = false;
      }
    });
  }
}