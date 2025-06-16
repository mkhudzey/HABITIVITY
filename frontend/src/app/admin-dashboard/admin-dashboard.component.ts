import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
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
}
