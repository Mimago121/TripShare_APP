import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px;">
      <h2>Lista de Usuarios (Desde Ktor + MySQL)</h2>
      <ul>
        <li *ngFor="let user of users">
          <strong>{{ user.userName }}</strong> - {{ user.email }}
        </li>
      </ul>
      <p *ngIf="users.length === 0">No hay usuarios o el servidor está apagado.</p>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('Error conectando con Ktor:', err)
    });
  }
}