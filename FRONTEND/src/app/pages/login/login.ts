import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
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
    if (this.loginForm.valid) {
      this.isLoading = true; // Activa spinner o texto
      const { email, pass } = this.loginForm.value;
      
      this.auth.login(email!, pass!).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'No hemos encontrado esa cuenta.';
        }
      });
    }
  }
}
  
