import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Para el *ngIf

@Component({
  selector: 'app-login',
  standalone: true, // Si usas una versión moderna de Angular
  imports: [ReactiveFormsModule, CommonModule], // Importante para que funcionen los formularios
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  // Definimos el tipo FormGroup
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router
  ) {
    // Inicializamos el formulario en el constructor
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      // Usamos el ! para asegurar a TS que los valores no son null
      this.auth.login(email!, password!).subscribe({
        next: (res) => {
          console.log('Bienvenido!', res);
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          this.errorMessage = 'Usuario o contraseña incorrectos';
          console.error(err);
        }
      });
    }
  }
}