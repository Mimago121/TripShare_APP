import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // <--- IMPORTANTE

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, ReactiveFormsModule], // <--- AÑADE ReactiveFormsModule
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isLoading = true;
  isEditModalOpen = false; // Controla si se ve el modal
  editForm: FormGroup;

  constructor(
    private userService: UserService, 
    private router: Router,
    private fb: FormBuilder // Para el formulario
  ) {
    // Inicializamos formulario vacío
    this.editForm = this.fb.group({
      userName: ['', Validators.required],
      bio: [''],
      avatarUrl: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      this.userService.getUserById(parsedUser.id).subscribe({
        next: (data) => {
          this.user = data;
          this.isLoading = false;
          // Rellenamos el formulario con los datos actuales
          this.editForm.patchValue({
            userName: data.userName,
            bio: data.bio || '',
            avatarUrl: data.avatarUrl || ''
          });
        },
        error: (err) => this.isLoading = false
      });
    }
  }

  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveProfile() {
    if (this.editForm.valid) {
      this.userService.updateUser(this.user.id, this.editForm.value).subscribe({
        next: () => {
          alert('¡Perfil actualizado!');
          this.isEditModalOpen = false;
          this.loadUserData(); // Recargamos para ver los cambios
          
          // Opcional: Actualizar el localStorage también para que el Navbar se entere
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localUser.userName = this.editForm.value.userName;
          localStorage.setItem('user', JSON.stringify(localUser));
        },
        error: (err) => alert('Error al guardar')
      });
    }
  }
}