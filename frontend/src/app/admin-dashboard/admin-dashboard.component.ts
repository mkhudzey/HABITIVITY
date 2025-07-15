import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {

  adminStats: {
    totalUsers: number;
    totalHabits: { daily: number; weekly: number; monthly: number };
    avgDailyPerUser: string;
    avgWeeklyPerUser: string;
    avgMonthlyPerUser: string;
  } | null = null;

  users: any[] = [];
  

  constructor(
      private authService: AuthService, 
      private router: Router) {


        const userId = this.authService.getUserId();

        if (userId){
          this.authService.getAdminStats().subscribe({
            next: (stats) => {
              this.adminStats = stats;
            },
            error: () => {
              console.error('Error al cargar estadísticas de admin');
            }
          });

          this.authService.getAllUsers().subscribe({
            next: (data) => {
              this.users = data;
            },
            error: () => {
              console.error('Error al cargar usuarios');
            }
          });

        }

  }

  showUsers = false;
  toggleShowUsers() {
    this.showUsers = !this.showUsers;
  }
        
  goBack() {
    this.router.navigate(['/profile']);
  }

  deleteUser(userId: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.authService.deleteAccount(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          alert('Usuario eliminado correctamente.');
        },
        error: () => {
          alert('Error al eliminar el usuario.');
        }
      });
    }
  }
  
editedUserId: number | null = null;
editedUsername: string = '';
editedEmail: string = '';

startEditUser(user: any) {
  this.editedUserId = user.id;
  this.editedUsername = user.username;
  this.editedEmail = user.email;
}

cancelEditUser() {
  this.editedUserId = null;
  this.editedUsername = '';
  this.editedEmail = '';
}

saveEditUser(userId: number) {
  const updatedUser = {
    id: userId,
    username: this.editedUsername,
    email: this.editedEmail,
  };

  this.authService.updateUser(updatedUser).subscribe(() => {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updatedUser };
    }
    this.cancelEditUser();
  });
}


}
