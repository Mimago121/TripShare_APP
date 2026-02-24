import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = ''; // Variable para el mensaje verde
  isLoading = false;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';   
      this.successMessage = ''; 

      const { userName, email, pass } = this.registerForm.value;

      this.auth.register(userName!, email!, pass!).subscribe({
        next: (res) => {
          this.isLoading = false;
          // 1. Mostramos mensaje de éxito en la UI (nada de alerts)
          this.successMessage = '¡Cuenta creada con éxito! Redirigiendo...';
          
          // 2. Esperamos 1.5 segundos y redirigimos al login automáticamente
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          // Mensaje de error en la UI
          this.errorMessage = 'Error al crear la cuenta. El email ya podría estar en uso.';
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}