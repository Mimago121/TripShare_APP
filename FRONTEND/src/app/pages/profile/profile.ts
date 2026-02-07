import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isLoading = true;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    // 1. Recuperamos el ID del usuario logueado del LocalStorage
    const localUser = localStorage.getItem('user');
    
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      
      // 2. Pedimos los datos frescos a la base de datos
      this.userService.getUserById(parsedUser.id).subscribe({
        next: (data) => {
          this.user = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando perfil:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Si no hay usuario en local, fuera de aquí
      this.router.navigate(['/login']);
    }
  }
}