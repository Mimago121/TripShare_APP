import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // Cambiado a 'pass' para coincidir con tu LoginRequest de Kotlin
      pass: ['', [Validators.required]] 
    });
  }

onSubmit() {
  // Si el formulario no es válido, cortamos aquí mismo
  if (this.loginForm.invalid) return;

  this.isLoading = true;
  const { email, pass } = this.loginForm.value;

  this.auth.login(email!, pass!).subscribe({
    next: (res) => {
      // 1. Guardamos los datos
      localStorage.setItem('user', JSON.stringify(res));
      
      // 2. Navegamos (esto hará que el componente se desconecte correctamente)
      this.router.navigate(['/home']);
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = 'Credenciales inválidas';
      console.error('Error en login:', err);
    }
  });
}
  }

  
