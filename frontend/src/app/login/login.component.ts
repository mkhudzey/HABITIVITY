import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    if (this.username.trim() === '' || this.password === '') {
      this.errorMessage = 'Por favor, ingresa las credenciales.';
      return;
    }

    this.errorMessage = '';


    this.authService.login(this.username, this.password)
    .subscribe({
      next: (response) => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
  
}