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
  templateUrl: './login.html', // Asegúrate de que el nombre coincide con tu archivo
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
      pass: ['', [Validators.required]] 
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, pass } = this.loginForm.value;

    this.auth.login(email!, pass!).subscribe({
      next: (res: any) => {
        // Guardamos los datos del usuario (que ahora incluyen el campo 'role')
        localStorage.setItem('user', JSON.stringify(res));
        
        // Lógica de redirección inteligente
        if (res.role === 'admin') {
          console.log('Eres admin, directo al panel de control 👮');
          this.router.navigate(['/admin']);
        } else {
          console.log('Eres usuario normal, a tus viajes ✈️');
          this.router.navigate(['/trips']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas';
        console.error('Error en login:', err);
      }
    });
  }
}