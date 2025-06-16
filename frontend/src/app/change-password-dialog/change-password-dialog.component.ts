import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent {

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  error = '';

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>, 
    private authService: AuthService, 
    private snackBar: MatSnackBar) {}

  onCancel() {
    this.dialogRef.close();
  }
  onSubmit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error = 'Usuario no válido';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las constraseñas no coinciden';
      return;
    }

    if (this.newPassword == this.currentPassword) {
      this.error = 'Las contraseñas son iguales';
    }

    this.authService.changePassword(userId, this.currentPassword, this.newPassword)
    .subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.snackBar.open('Contraseña Cambiada', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-toast']
    });
      },
      error: () => {
        this.error = 'Error al cambiar la contraseña'
      }
    });
  }
}
